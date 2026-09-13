import { useMemo, useState } from "react";
import type { CaseFile } from "@/data/schema";
import { stableStringify } from "@/data/json";
import { api } from "@/admin/api";
import { useAdminData } from "@/admin/contexts";
import { compactCaseFile } from "@/admin/compact";
import { useDraft } from "@/admin/hooks/useDraft";
import { ItemsList } from "@/admin/components/ItemsList";
import { Tabs } from "@/admin/components/Tabs";
import { SaveActions } from "@/admin/components/DraftStatus";
import { InfoTab } from "@/admin/components/case/InfoTab";
import { QuestionsTab } from "@/admin/components/case/QuestionsTab";
import { GroupsTab } from "@/admin/components/case/GroupsTab";
import { ArticlesTab } from "@/admin/components/case/ArticlesTab";

const TABS = [
  { id: "info", label: "Общая информация" },
  { id: "questions", label: "Отвечает на вопросы" },
  { id: "groups", label: "Группы слов" },
  { id: "articles", label: "Статьи" },
];

const sameCase = (a: CaseFile, b: CaseFile) => stableStringify(compactCaseFile(a)) === stableStringify(compactCaseFile(b));

function CaseEditor({ caseFile }: { caseFile: CaseFile }) {
  const state = useDraft(caseFile, sameCase);
  const [tab, setTab] = useState("info");
  const saveCase = (next: CaseFile) => state.save(next, (c) => api.putCase(compactCaseFile(c)));
  // One draft for the whole case: every tab's "Сохранить" writes all of it.
  const actions = (
    <SaveActions state={state} onSave={() => void saveCase(state.draft)} conflictMessage="Падеж изменился на диске." reloadLabel="Перезагрузить падеж" />
  );
  const props = { value: state.draft, onChange: state.setDraft, actions };

  return (
    <div className="case-word">
      <Tabs tabs={TABS} current={tab} onChange={setTab} />
      {tab === "info" && <InfoTab {...props} />}
      {tab === "questions" && <QuestionsTab {...props} />}
      {tab === "groups" && <GroupsTab {...props} />}
      {tab === "articles" && <ArticlesTab state={state} saveCase={saveCase} actions={actions} />}
    </div>
  );
}

export function CasesPage() {
  const data = useAdminData();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const items = useMemo(
    () => [...data.cases].sort((a, b) => a.position - b.position).map((c) => ({ id: c.id, name: c.name.russian ?? c.id })),
    [data.cases],
  );
  const selected = data.cases.find((c) => c.id === selectedId);

  return (
    <div className="page page-cases">
      <div className="page-header">
        <h3>Падежи</h3>
      </div>
      <div className="page-2col">
        <div>
          <ItemsList items={items} selectedId={selectedId} onSelect={setSelectedId} />
        </div>
        <div>{selected && <CaseEditor key={selected.id} caseFile={selected} />}</div>
      </div>
    </div>
  );
}
