import type { QuestionGroupView } from "@/model/Case";
import { QuestionGroup } from "./QuestionGroup";

export function QuestionGroups({ questionGroups }: { questionGroups: QuestionGroupView[] }) {
  if (questionGroups.length === 0) return null;
  return (
    <div className="full-case__questions">
      <h3>Отвечает на вопросы:</h3>
      {questionGroups.map((g, inx) => <QuestionGroup key={g.type ?? inx} group={g} />)}
    </div>
  );
}
