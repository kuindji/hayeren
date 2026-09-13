import type { Draft } from "@/admin/hooks/useDraft";

type DraftFlags = Pick<Draft<unknown>, "conflict" | "saving" | "saved" | "error" | "reload">;

export function ConflictNotice({ message, reloadLabel, onReload, disabled }: {
  /** What changed, e.g. "Слово изменилось на диске." */
  message: string;
  reloadLabel: string;
  onReload: () => void;
  disabled: boolean;
}) {
  return (
    <span className="save-error" role="alert">
      {`${message} Перезагрузка отменит ваши несохранённые изменения.`}
      <button type="button" onClick={onReload} disabled={disabled}>{reloadLabel}</button>
    </span>
  );
}

export function DraftStatus({ state, conflictMessage, reloadLabel }: { state: DraftFlags; conflictMessage: string; reloadLabel: string }) {
  return (
    <>
      {state.conflict && (
        <ConflictNotice message={conflictMessage} reloadLabel={reloadLabel} onReload={state.reload} disabled={state.saving} />
      )}
      {state.saved && <span className="save-status" role="status">Сохранено</span>}
      {state.error && <span className="save-error" role="alert">{state.error}</span>}
    </>
  );
}

/** A "Сохранить" button, disabled while saving or in conflict, followed by the draft's status. */
export function SaveActions({ state, onSave, disabled = false, conflictMessage, reloadLabel }: {
  state: DraftFlags;
  onSave: () => void;
  disabled?: boolean;
  conflictMessage: string;
  reloadLabel: string;
}) {
  return (
    <div className="word-actions">
      <button type="button" onClick={onSave} disabled={disabled || state.saving || state.conflict}>Сохранить</button>
      <DraftStatus state={state} conflictMessage={conflictMessage} reloadLabel={reloadLabel} />
    </div>
  );
}
