import type { Form } from "@/data/schema";
import { PRONOUNS, type Verb } from "@/model/Verb";
import { Text } from "@/shared/Text";
import { useLanguage } from "../../hooks";

function Cell({ form }: { form: Form | undefined }) {
  const language = useLanguage();
  if (!form) return <td />;
  return (
    <td>
      <span className="armenian"><Text t={form.armenian} /></span>
      {form.informal && <span className="informal"><i>разг.</i><Text t={form.informal} /></span>}
      {form.transcription && <span className="transcription"><Text t={form.transcription} /></span>}
      {form[language] && <span className="translation"><Text t={form} /></span>}
      {form.comment?.[language] && <span className="comment">(<Text t={form.comment} />)</span>}
    </td>
  );
}

export function VerbTable({ verb, tenseId }: { verb: Verb; tenseId: string }) {
  const language = useLanguage();
  const entry = verb.tenseForm(tenseId);
  if (!entry) return null;
  const persons = verb.persons(tenseId);
  const hasNegative = persons.some((p) => entry.negative?.[p] !== undefined);

  return (
    <div className="word__info">
      <table className="verb-table">
        <thead>
          <tr><th /><th>Утверждение</th>{hasNegative && <th>Отрицание</th>}</tr>
        </thead>
        <tbody>
          {persons.map((p) => (
            <tr key={p}>
              <td className="pronoun">{PRONOUNS[p]}</td>
              <Cell form={entry.forms?.[p]} />
              {hasNegative && <Cell form={entry.negative?.[p]} />}
            </tr>
          ))}
        </tbody>
      </table>
      {entry.comment?.[language] && <p className="comment"><Text t={entry.comment} /></p>}
      {entry.examples && entry.examples.length > 0 && (
        <div className="word__examples">
          {entry.examples.map((e, inx) => (
            <div key={inx}>
              <span className="armenian"><Text t={e.armenian} /></span>
              {e.transcription && <span className="transcription"><Text t={e.transcription} /></span>}
              <span className="translation"><Text t={e} /></span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
