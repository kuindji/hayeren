import type { CaseQuestion } from "@/data/schema";
import type { QuestionGroupView } from "@/model/Case";
import { Text } from "@/shared/Text";
import { useSwallowEventCallback } from "@/shared/hooks/useSwallowEventCallback";
import { LocalFilterContext } from "../../contexts";
import { useFilter, useFilterKey, useLanguage } from "../../hooks";

function Question({ q }: { q: CaseQuestion }) {
  const localFilter = useFilter(LocalFilterContext);
  const pp = useFilterKey("pposition", LocalFilterContext);
  const language = useLanguage();
  // The filter stores a missing pposition as null, so compare against q.pposition ?? null. The old code compared
  // null with undefined, which never matched: pposition-less questions could not be highlighted or toggled off.
  const pposition = q.pposition ?? null;
  const active = !!pp && pp.pposition === pposition && pp.type === q.type;

  const onClick = useSwallowEventCallback(
    () => localFilter.set("pposition", active ? null : { pposition, type: q.type }),
    [localFilter, active, pposition, q],
  );

  return (
    <li className={["clickable", active ? "active" : ""].join(" ")}>
      <a href="#" onClick={onClick}>
        <Text t={q.question} />
        {q.comment?.[language] && <span className="comment"><Text t={q.comment} /></span>}
      </a>
    </li>
  );
}

export function QuestionGroup({ group }: { group: QuestionGroupView }) {
  if (group.questions.length === 0) return null;
  return (
    <div className="full-case__qgroup">
      {group.name && <h4><Text t={group.name} /></h4>}
      <ul>
        {group.questions.map((q, inx) => <Question key={inx} q={q} />)}
      </ul>
    </div>
  );
}
