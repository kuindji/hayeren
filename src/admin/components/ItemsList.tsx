import { useMemo, useState } from "react";
import type { WordFile, WordType } from "@/data/schema";
import { Word } from "@/model/Word";

export function ItemsList({ type, words, selectedId, onSelect }: {
  type: WordType;
  words: WordFile[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const items = useMemo(
    () =>
      words
        .map((w) => {
          const nominative = new Word(type, w).nominative();
          return { id: w.id, name: nominative.russian ?? w.id, armenian: nominative.armenian ?? "" };
        })
        .sort((a, b) => a.name.localeCompare(b.name)),
    [type, words],
  );
  const q = query.trim().toLowerCase();
  const visible = q === "" ? items : items.filter((i) => [i.name, i.id, i.armenian].some((s) => s.toLowerCase().includes(q)));

  return (
    <div className="items-list">
      <input type="search" placeholder="Поиск" aria-label="Поиск" value={query} onChange={(e) => setQuery(e.target.value)} />
      <ul>
        {visible.map((i) => (
          <li key={i.id}>
            <a
              href="#"
              className={i.id === selectedId ? "active" : undefined}
              onClick={(e) => {
                e.preventDefault();
                onSelect(i.id);
              }}
            >
              {i.name}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
