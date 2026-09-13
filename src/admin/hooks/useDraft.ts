import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { errorText } from "@/admin/api";

const SAVED_MS = 2000;

export interface Draft<T> {
  draft: T;
  setDraft: Dispatch<SetStateAction<T>>;
  /** The on-disk value changed while the draft has unsaved edits. Saving is blocked until `reload`. */
  conflict: boolean;
  /** A write is in flight: every write button should be disabled. */
  saving: boolean;
  saved: boolean;
  error: string | null;
  /** Writes `next` with `write`; on success `next` becomes the base. Resolves to whether it succeeded. */
  save: (next: T, write: (value: T) => Promise<unknown>) => Promise<boolean>;
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
  useEffect(() => () => clearTimeout(savedTimer.current), []);

  const save = async (next: T, write: (value: T) => Promise<unknown>) => {
    if (saving || conflict) return false;
    const seq = ++requestSeq.current;
    clearTimeout(savedTimer.current);
    setSaving(true);
    setPending({ value: next });
    setSaved(false);
    setError(null);
    try {
      await write(next);
      if (seq !== requestSeq.current) return false;
      setBase(next);
      setSaved(true);
      savedTimer.current = setTimeout(() => setSaved(false), SAVED_MS);
      return true;
    } catch (e) {
      if (seq !== requestSeq.current) return false;
      // The draft is left untouched so the user can fix it and retry.
      setError(`Не удалось сохранить: ${errorText(e)}`);
      return false;
    } finally {
      if (seq === requestSeq.current) {
        setSaving(false);
        setPending(null);
      }
    }
  };

  const run = async (action: () => Promise<unknown>, failure: string) => {
    if (saving) return false;
    const seq = ++requestSeq.current;
    clearTimeout(savedTimer.current);
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      await action();
      return seq === requestSeq.current;
    } catch (e) {
      if (seq === requestSeq.current) setError(`${failure}: ${errorText(e)}`);
      return false;
    } finally {
      if (seq === requestSeq.current) setSaving(false);
    }
  };

  const reload = () => {
    // Reloading mid-save would set base and draft to the other version, and the save resolving afterwards would make
    // base the saved value again: the conflict would then clear on the echo and the next save would silently replace
    // the edits that were just written.
    if (saving) return;
    setBase(source);
    setDraft(source);
    setConflict(false);
    setSaved(false);
    setError(null);
  };

  return { draft, setDraft, conflict, saving, saved, error, save, run, reload };
}
