import { useState } from "react";
import type { Example } from "@/data/schema";
import { useAdminData } from "@/admin/contexts";
import { FormEditor } from "./FormEditor";
import { PrepostpositionSelector } from "./PrepostpositionSelector";

export function ExamplesEditor({ examples, onChange, showPposition }: {
  examples: Example[] | undefined;
  onChange: (next: Example[] | undefined) => void;
  showPposition: boolean;
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
    if (editing === null) return;
    const next = editing === "new" ? [...list, value] : list.map((e, i) => (i === editing ? value : e));
    setEditing(null);
    const kept = next.filter((e) => Object.keys(e).length > 0);
    onChange(kept.length > 0 ? kept : undefined);
  };
  const remove = (index: number) => {
    if (!window.confirm("Вы уверены?")) return;
    // Indices shift after a removal, so an open edit form would otherwise commit over a different example.
    setEditing(null);
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
      <button type="button" onClick={commit}>Сохранить</button>
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
                <button type="button" onClick={() => remove(i)}>Удалить</button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
