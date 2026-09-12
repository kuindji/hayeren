import type { Form } from "@/data/schema";
import type { Word } from "@/model/Word";
import { Text } from "@/shared/Text";
import { useRequired } from "@/shared/hooks/useRequired";
import { CaseContext } from "../contexts";
import { useGet, useLanguage } from "../hooks";

function OneForm({ form, pfx = "" }: { form: Form; pfx?: string }) {
  const language = useLanguage();
  return (
    <p className="word-form">
      {pfx && <span className="pfx">{pfx}</span>}
      <span className="armenian"><Text t={form.armenian} /></span>
      {form.informal && (
        <span className="informal">
          <i>разг.</i>
          <Text t={form.informal} />
        </span>
      )}
      {form.transcription && <span className="transcription"><Text t={form.transcription} /></span>}
      <span className="translation"><Text t={form} /></span>
      {form.comment?.[language] && <span className="comment">(<Text t={form.comment} />)</span>}
    </p>
  );
}

export function WordInfo({ word }: { word: Word }) {
  const lcase = useRequired(CaseContext);
  const nominativeCase = useGet("case", "nominative");
  const language = useLanguage();
  const nominative = word.caseForm("nominative");
  const caseForm = lcase.id !== "nominative" ? word.caseForm(lcase.id) : undefined;

  return (
    <div className="word__info">
      {lcase.id !== "nominative" && <h5><Text t={nominativeCase?.name} /></h5>}
      {nominative?.single ? (
        <>
          <OneForm form={nominative.single} pfx="ед.ч." />
          {nominative.plural?.[language] && <OneForm form={nominative.plural} pfx="мн.ч." />}
        </>
      ) : (
        <OneForm form={{}} />
      )}

      {lcase.id !== "nominative" && (
        <>
          <h5><Text t={lcase.name} /></h5>
          {caseForm?.single?.[language] ? (
            <>
              <OneForm form={caseForm.single} pfx="ед.ч." />
              {caseForm.plural?.[language] && <OneForm form={caseForm.plural} pfx="мн.ч." />}
            </>
          ) : (
            <OneForm form={caseForm?.single ?? {}} />
          )}
        </>
      )}
    </div>
  );
}
