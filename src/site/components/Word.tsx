import { useMemo, useState } from "react";
import type { Form } from "@/data/schema";
import type { Word as WordEntity } from "@/model/Word";
import { IconExpand } from "@/shared/icons";
import { Text } from "@/shared/Text";
import { useRequired } from "@/shared/hooks/useRequired";
import { useSwallowEventCallback } from "@/shared/hooks/useSwallowEventCallback";
import { CaseContext, LocalFilterContext } from "../contexts";
import { useFilter, useFilterKey, useLanguage } from "../hooks";
import { WordInfo } from "./WordInfo";

export function Word({ word }: { word: WordEntity }) {
  const language = useLanguage();
  const globalFilter = useFilter();
  const globalWordId = useFilterKey("word");
  const lcase = useRequired(CaseContext);
  const pp = useFilterKey("pposition", LocalFilterContext);
  const [localExpanded, setLocalExpanded] = useState(false);
  const caseId = lcase.id;

  const expanded = localExpanded || globalWordId === word.id;
  const nominative = useMemo(() => word.nominative(), [word]);
  const caseForm = useMemo(() => word.caseForm(caseId), [word, caseId]);
  const examples = useMemo(() => word.getExamples(caseId, pp ?? null), [word, caseId, pp]);
  const form: Form = caseForm?.single ?? {};

  const hasInfo = !(caseId === "nominative" && !caseForm?.plural?.armenian && examples.length === 0);

  const onExpandClick = useSwallowEventCallback(() => setLocalExpanded((prev) => !prev), []);
  const onWordClick = useSwallowEventCallback(() => globalFilter.set("word", word.id), [globalFilter, word]);

  return (
    <div className={["word", expanded ? "expanded" : ""].join(" ")}>
      <div className="word__header">
        {caseId !== "nominative" ? (
          <a className="nominative" href="#" onClick={onWordClick}><Text t={nominative.armenian} /></a>
        ) : null}

        {caseId === "nominative" ? (
          <a href="#" className="armenian" onClick={onWordClick}><Text t={form.armenian} /></a>
        ) : (
          <span className="armenian"><Text t={form.armenian} /></span>
        )}

        {form.transcription && <span className="transcription"><Text t={form.transcription} /></span>}

        <span className="translation"><Text t={form} /></span>

        {word.comment?.[language] && <span className="comment">(<Text t={word.comment} />)</span>}

        <span className="actions">
          {hasInfo && <a href="#" className="expand" onClick={onExpandClick}><IconExpand /></a>}
        </span>
      </div>

      {expanded && <WordInfo word={word} />}

      {(!!pp || expanded) && examples.length > 0 && (
        <div className="word__examples">
          {examples.map((e, inx) => (
            <div key={inx}>
              <span className="armenian"><Text t={e.armenian} /></span>
              {e.transcription && <span className="transcription"><Text t={e.transcription} /></span>}
              <span className="translation"><Text t={e} /></span>
              {e.comment?.[language] && <span className="comment">(<Text t={e.comment} />)</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
