import type { CaseFile } from "@/data/schema";
import { Tabs } from "./Tabs";

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
  return <Tabs tabs={tabs} current={current} onChange={onChange} />;
}
