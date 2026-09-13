import { useMemo } from "react";
import type { Declension } from "@/data/schema";
import { stableStringify } from "@/data/json";
import { api } from "@/admin/api";
import { useAdminData } from "@/admin/contexts";
import { compactDeclension, setOptional } from "@/admin/compact";
import { useDraft } from "@/admin/hooks/useDraft";
import { setLocalized } from "@/admin/components/LocalizedInput";
import { SaveActions } from "@/admin/components/DraftStatus";

/** A table row: `key` stays stable while the id is typed, `isNew` keeps the id editable until the row is saved. */
interface Row { key: string; isNew: boolean; value: Declension }

const toRows = (list: Declension[]): Row[] => list.map((d) => ({ key: `disk-${d.id}`, isNew: false, value: d }));
const values = (rows: Row[]) => rows.map((r) => compactDeclension(r.value));
const sameRows = (a: Row[], b: Row[]) => stableStringify(values(a)) === stableStringify(values(b));

export function DeclensionsPage() {
  const data = useAdminData();
  const source = useMemo(() => toRows(data.declensions), [data.declensions]);
  const state = useDraft(source, sameRows);
  const { draft, setDraft } = state;
  // PUT /declensions accepts [] and would empty declensions.json, leaving every reference to a declension dangling.
  const empty = draft.length === 0;

  const patch = (key: string, fn: (d: Declension) => Declension) =>
    setDraft((rows) => rows.map((r) => (r.key === key ? { ...r, value: fn(r.value) } : r)));

  const save = async () => {
    if (empty) return;
    const next = draft;
    if (await state.save(next, (rows) => api.putDeclensions(values(rows)))) {
      const saved = new Set(next.map((r) => r.key));
      setDraft((rows) => rows.map((r) => (r.isNew && saved.has(r.key) ? { ...r, isNew: false } : r)));
    }
  };

  return (
    <div className="page page-declensions">
      <div className="page-header">
        <h3>Склонения</h3>
        <button
          type="button"
          onClick={() => setDraft((rows) => [...rows, { key: `new-${crypto.randomUUID()}`, isNew: true, value: { id: "", name: {} } }])}
          disabled={state.saving}
        >
          Добавить
        </button>
      </div>
      <table className="declensions-table">
        <thead>
          <tr>
            <th>Идентификатор</th>
            <th>Название (русский)</th>
            <th>Название (армянский)</th>
            <th>Комментарий</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {draft.map((row) => (
            <tr key={row.key}>
              <td>
                <input
                  type="text"
                  aria-label="Идентификатор"
                  value={row.value.id}
                  disabled={!row.isNew}
                  onChange={(e) => patch(row.key, (d) => ({ ...d, id: e.target.value }))}
                />
              </td>
              <td>
                <input
                  type="text"
                  aria-label="Название (русский)"
                  value={row.value.name.russian ?? ""}
                  onChange={(e) => patch(row.key, (d) => ({ ...d, name: setLocalized(d.name, "russian", e.target.value) ?? {} }))}
                />
              </td>
              <td>
                <input
                  type="text"
                  aria-label="Название (армянский)"
                  value={row.value.name.armenian ?? ""}
                  onChange={(e) => patch(row.key, (d) => ({ ...d, name: setLocalized(d.name, "armenian", e.target.value) ?? {} }))}
                />
              </td>
              <td>
                <input
                  type="text"
                  aria-label="Комментарий"
                  value={row.value.comment?.russian ?? ""}
                  onChange={(e) => patch(row.key, (d) => setOptional(d, "comment", setLocalized(d.comment, "russian", e.target.value)))}
                />
              </td>
              <td>
                <button
                  type="button"
                  className="danger"
                  onClick={() => setDraft((rows) => rows.filter((r) => r.key !== row.key))}
                  disabled={state.saving}
                >
                  Удалить
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {empty && <p className="save-error" role="alert">Список склонений не может быть пустым: сохранение отключено.</p>}
      <SaveActions
        state={state}
        onSave={() => void save()}
        disabled={empty}
        conflictMessage="Склонения изменились на диске."
        reloadLabel="Перезагрузить склонения"
      />
    </div>
  );
}
