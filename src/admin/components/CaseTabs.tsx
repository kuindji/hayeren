import type { CaseFile } from "@/data/schema";

export function CaseTabs({ cases, current, onChange, withInfo = false }: {
  cases: CaseFile[];
  current: string;
  onChange: (id: string) => void;
  withInfo?: boolean;
}) {
  const tabs = [
    ...(withInfo ? [{ id: "info", label: "Общая информация" }] : []),
    ...cases.map((c) => ({ id: c.id, label: c.name.russian ?? c.id })),
  ];
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
