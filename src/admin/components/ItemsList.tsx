import { useState } from "react";

export interface ListItem {
  id: string;
  name: string;
  /** Extra strings the search box matches besides the name and id. */
  search?: string[];
}

/** A searchable list of items, shown in the given order. */
export function ItemsList({ items, selectedId, onSelect }: {
  items: ListItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const visible = q === "" ? items : items.filter((i) => [i.name, i.id, ...(i.search ?? [])].some((s) => s.toLowerCase().includes(q)));

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
