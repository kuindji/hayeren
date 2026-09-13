export function Tabs({ tabs, current, onChange }: {
  tabs: { id: string; label: string }[];
  current: string;
  onChange: (id: string) => void;
}) {
  return (
    <div role="tablist" className="case-tabs">
      {tabs.map((t) => (
        <button key={t.id} type="button" role="tab" aria-selected={t.id === current} onClick={() => onChange(t.id)}>
          {t.label}
        </button>
      ))}
    </div>
  );
}
