import { useState } from "react";
import type { Example } from "@/data/schema";
import { useAdminData } from "@/admin/contexts";
import { FormEditor } from "./FormEditor";
import { PrepostpositionSelector } from "./PrepostpositionSelector";

export function ExamplesEditor({ examples, onChange, showPposition, disabled = false }: {
  examples: Example[] | undefined;
  onChange: (next: Example[] | undefined) => void;
  showPposition: boolean;
  /** True while a save is in flight (or the word is in conflict): blocks the actions that write. */
  disabled?: boolean;
}) {
  const { words } = useAdminData();
  const list = examples ?? [];
  const [editing, setEditing] = useState<number | "new" | null>(null);
  const [value, setValue] = useState<Example>({});

  const start = (index: number | "new") => {
    setEditing(index);
    setValue(index === "new" ? {} : (list[index] ?? {}));
  };
  const commit = () => {
    if (editing === null || disabled) return;
    const next = editing === "new" ? [...list, value] : list.map((e, i) => (i === editing ? value : e));
    setEditing(null);
    const kept = next.filter((e) => Object.keys(e).length > 0);
    onChange(kept.length > 0 ? kept : undefined);
  };
  const remove = (index: number) => {
    if (disabled || !window.confirm("Вы уверены?")) return;
    // Indices shift after a removal: close the form only if it edits the removed row, keep a later row's form pointing
    // at the same example, and leave a "new" form (and its typed text) alone.
    if (editing === index) setEditing(null);
    else if (typeof editing === "number" && editing > index) setEditing(editing - 1);
    const kept = list.filter((_, i) => i !== index);
    onChange(kept.length > 0 ? kept : undefined);
  };

  const { pposition, ...form } = value;
  const editor = (
    <div className="case-example-form">
      {showPposition && (
        <PrepostpositionSelector
          value={pposition}
          onChange={(next) => setValue({ ...form, ...(next === undefined ? {} : { pposition: next }) })}
        />
      )}
      <FormEditor
        form={form}
        onChange={(next) => setValue({ ...next, ...(pposition === undefined ? {} : { pposition }) })}
      />
      <button type="button" onClick={commit} disabled={disabled}>Сохранить</button>
      <button type="button" onClick={() => setEditing(null)}>Отменить</button>
    </div>
  );

  return (
    <div className="case-examples">
      <h5>
        Примеры
        <button type="button" onClick={() => start("new")}>Добавить пример</button>
      </h5>
      {editing === "new" && editor}
      {list.length > 0 && (
        <ul className="examples-list">
          {list.map((e, i) => {
            if (editing === i) return <li key={i}>{editor}</li>;
            const pp = e.pposition === undefined ? undefined : words.prepostposition.find((p) => p.id === e.pposition);
            return (
              <li key={i}>
                <div>{[e.armenian, e.russian, e.comment?.russian].filter(Boolean).join(" - ")}</div>
                {e.pposition !== undefined && (
                  <span className="tag">{pp?.name ? `${pp.name.armenian ?? ""} / ${pp.name.russian ?? ""}` : e.pposition}</span>
                )}
                <button type="button" onClick={() => start(i)}>Изменить</button>
                <button type="button" onClick={() => remove(i)} disabled={disabled}>Удалить</button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
