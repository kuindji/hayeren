import { useEffect, useLayoutEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { errorText } from "@/admin/api";

const SAVED_MS = 2000;

export interface SaveSteps {
  /** Runs first, under this draft's in-flight state; resolving to false stops before this draft is written. */
  before?: () => Promise<boolean>;
  /** Runs after this draft was written, still in flight; its result is the result of the whole save. */
  after?: () => Promise<boolean>;
}

export interface Draft<T> {
  draft: T;
  setDraft: Dispatch<SetStateAction<T>>;
  /** The draft as of the latest render, for code that resumes after an await. */
  latest: () => T;
  /** The on-disk value changed while the draft has unsaved edits. Saving is blocked until `reload`. */
  conflict: boolean;
  /** A write is in flight: every write button should be disabled. */
  saving: boolean;
  saved: boolean;
  error: string | null;
  /** Writes `next` with `write`; on success `next` becomes the base. Resolves to whether it succeeded. */
  save: (next: T, write: (value: T) => Promise<unknown>) => Promise<boolean>;
  /**
   * A multi-step save: `before` runs first, then `build` is applied to the draft as it is at that moment (so on-disk
   * changes adopted meanwhile are kept) and the result is written and applied to the draft, then `after` runs. The
   * whole sequence counts as in flight, and a conflict raised during `before` stops it before this draft is written.
   */
  saveLatest: (build: (latest: T) => T, write: (value: T) => Promise<unknown>, steps?: SaveSteps) => Promise<boolean>;
  /** Runs another write (e.g. a delete) under the same in-flight guard; a failure shows `${failure}: ${error}`. */
  run: (action: () => Promise<unknown>, failure: string) => Promise<boolean>;
  /** Drops the draft and adopts the current on-disk value. Does nothing while a write is in flight. */
  reload: () => void;
}

/**
 * Draft/save state for an editor of one on-disk value (`source`, which must keep its identity until the data really
 * reloads). `same` tells whether two values are the same once saved (compact + stableStringify), so the editor's own
 * save echoed back by Vite HMR is not mistaken for someone else's change.
 */
export function useDraft<T>(source: T, same: (a: T, b: T) => boolean): Draft<T> {
  // `base` is the on-disk value the draft was started from (or last saved as). Comparing the two tells whether there
  // are unsaved edits when newer data arrives.
  const [base, setBase] = useState<T>(source);
  const [draft, setDraft] = useState<T>(source);
  const [conflict, setConflict] = useState(false);
  // The value being written right now. Vite can push the saved file back before the PUT response resolves, and that
  // echo must not count as someone else's change. Boxed, so a falsy T is still "pending".
  const [pending, setPending] = useState<{ value: T } | null>(null);
  const [seen, setSeen] = useState<T>(source);
  if (source !== seen) {
    // Adjusting state while rendering (React's "storing information from previous renders" pattern): no effect, no
    // extra paint with stale values.
    setSeen(source);
    if (same(source, base)) {
      setConflict(false);
    } else if (pending !== null && same(source, pending.value)) {
      setBase(source);
      setConflict(false);
    } else if (same(draft, base)) {
      setBase(source);
      setDraft(source);
      setConflict(false);
    } else {
      setConflict(true);
    }
  }
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const savedTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  // Only the latest request may update the status: an earlier one resolving late must not show a stale result.
  const requestSeq = useRef(0);
  // The guards below run in handlers that may resume after an await, when this render's `draft`, `conflict` and
  // `saving` are stale; they read these mirrors instead.
  const draftRef = useRef(draft);
  const conflictRef = useRef(conflict);
  const savingRef = useRef(false);
  useLayoutEffect(() => {
    draftRef.current = draft;
    conflictRef.current = conflict;
  });
  useEffect(() => () => clearTimeout(savedTimer.current), []);

  const setBusy = (busy: boolean) => {
    savingRef.current = busy;
    setSaving(busy);
  };

  const perform = async (build: (latest: T) => T, write: (value: T) => Promise<unknown>, applyToDraft: boolean, steps: SaveSteps = {}) => {
    if (savingRef.current || conflictRef.current) return false;
    const seq = ++requestSeq.current;
    clearTimeout(savedTimer.current);
    setBusy(true);
    setSaved(false);
    setError(null);
    try {
      if (steps.before && !(await steps.before())) return false;
      // A conflict raised while `before` ran blocks the write; its notice is already shown.
      if (seq !== requestSeq.current || conflictRef.current) return false;
      const next = build(draftRef.current);
      setPending({ value: next });
      await write(next);
      if (seq !== requestSeq.current) return false;
      setBase(next);
      if (applyToDraft) setDraft(build);
      setSaved(true);
      savedTimer.current = setTimeout(() => setSaved(false), SAVED_MS);
      return steps.after ? await steps.after() : true;
    } catch (e) {
      if (seq !== requestSeq.current) return false;
      // The draft is left untouched so the user can fix it and retry.
      setError(`Не удалось сохранить: ${errorText(e)}`);
      return false;
    } finally {
      if (seq === requestSeq.current) {
        setBusy(false);
        setPending(null);
      }
    }
  };

  const save = (next: T, write: (value: T) => Promise<unknown>) => perform(() => next, write, false);
  const saveLatest = (build: (latest: T) => T, write: (value: T) => Promise<unknown>, steps?: SaveSteps) => perform(build, write, true, steps);

  const run = async (action: () => Promise<unknown>, failure: string) => {
    if (savingRef.current) return false;
    const seq = ++requestSeq.current;
    clearTimeout(savedTimer.current);
    setBusy(true);
    setSaved(false);
    setError(null);
    try {
      await action();
      return seq === requestSeq.current;
    } catch (e) {
      if (seq === requestSeq.current) setError(`${failure}: ${errorText(e)}`);
      return false;
    } finally {
      if (seq === requestSeq.current) setBusy(false);
    }
  };

  const reload = () => {
    // Reloading mid-save would set base and draft to the other version, and the save resolving afterwards would make
    // base the saved value again: the conflict would then clear on the echo and the next save would silently replace
    // the edits that were just written.
    if (savingRef.current) return;
    setBase(source);
    setDraft(source);
    setConflict(false);
    setSaved(false);
    setError(null);
  };

  return { draft, setDraft, latest: () => draftRef.current, conflict, saving, saved, error, save, saveLatest, run, reload };
}
