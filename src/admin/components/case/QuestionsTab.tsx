import type { Dispatch, ReactNode, SetStateAction } from "react";
import { QuestionTypeSchema, type CaseFile, type CaseQuestion, type Localized } from "@/data/schema";
import { setOptional } from "@/admin/compact";
import { LocalizedInput } from "@/admin/components/LocalizedInput";
import { PrepostpositionSelector } from "@/admin/components/PrepostpositionSelector";

type QuestionType = NonNullable<CaseQuestion["type"]>;
type QuestionGroups = NonNullable<CaseFile["questionGroups"]>;

const TYPE_LABELS: Record<QuestionType, string> = { noun: "Для существительных", pronoun: "Для местоимений" };
const TYPES = QuestionTypeSchema.options;

function setGroupName(groups: QuestionGroups, type: QuestionType, name: Localized | undefined): QuestionGroups {
  if (name === undefined) return groups.filter((g) => g.type !== type);
  return groups.some((g) => g.type === type) ? groups.map((g) => (g.type === type ? { type, name } : g)) : [...groups, { type, name }];
}

export function QuestionsTab({ value, onChange, actions }: { value: CaseFile; onChange: Dispatch<SetStateAction<CaseFile>>; actions: ReactNode }) {
  const questions = value.questions ?? [];
  const setQuestions = (update: (list: CaseQuestion[]) => CaseQuestion[]) => onChange((c) => ({ ...c, questions: update(c.questions ?? []) }));
  const patch = (index: number, fn: (q: CaseQuestion) => CaseQuestion) => setQuestions((list) => list.map((q, i) => (i === index ? fn(q) : q)));

  return (
    <div className="case-questions">
      {questions.map((q, i) => (
        <fieldset key={i} aria-label="Вопрос" className="case-question">
          <select
            aria-label="Тип"
            value={q.type ?? ""}
            onChange={(e) => {
              const type = QuestionTypeSchema.safeParse(e.target.value);
              patch(i, (x) => setOptional(x, "type", type.success ? type.data : undefined));
            }}
          >
            <option value="">Без типа</option>
            {TYPES.map((t) => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
          </select>
          <PrepostpositionSelector value={q.pposition} onChange={(v) => patch(i, (x) => setOptional(x, "pposition", v))} />
          <LocalizedInput label="Вопрос" value={q.question} onChange={(v) => patch(i, (x) => ({ ...x, question: v ?? {} }))} />
          <LocalizedInput label="Комментарий" value={q.comment} onChange={(v) => patch(i, (x) => setOptional(x, "comment", v))} />
          <button type="button" className="danger" onClick={() => setQuestions((list) => list.filter((_, j) => j !== i))}>Удалить вопрос</button>
        </fieldset>
      ))}
      <button type="button" onClick={() => setQuestions((list) => [...list, { question: {} }])}>Добавить вопрос</button>
      <section className="case-question-groups">
        <h4>Группы вопросов</h4>
        {TYPES.map((type) => (
          <LocalizedInput
            key={type}
            label={`Название группы: ${TYPE_LABELS[type].toLowerCase()}`}
            value={value.questionGroups?.find((g) => g.type === type)?.name}
            onChange={(v) => onChange((c) => ({ ...c, questionGroups: setGroupName(c.questionGroups ?? [], type, v) }))}
          />
        ))}
      </section>
      {actions}
    </div>
  );
}
