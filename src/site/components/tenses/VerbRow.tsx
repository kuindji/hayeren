import { useMemo, useState } from "react";
import type { Verb } from "@/model/Verb";
import { IconExpand } from "@/shared/icons";
import { Text } from "@/shared/Text";
import { useRequired } from "@/shared/hooks/useRequired";
import { useSwallowEventCallback } from "@/shared/hooks/useSwallowEventCallback";
import { TenseContext } from "../../contexts";
import { useFilter, useFilterKey, useLanguage } from "../../hooks";
import { VerbTable } from "./VerbTable";

export function VerbRow({ verb }: { verb: Verb }) {
  const language = useLanguage();
  const globalFilter = useFilter();
  const pinnedId = useFilterKey("word");
  const tense = useRequired(TenseContext);
  const [localExpanded, setLocalExpanded] = useState(false);

  const expanded = localExpanded || pinnedId === verb.id;
  const teaser = useMemo(() => verb.teaser(tense.id), [verb, tense.id]);

  const onExpandClick = useSwallowEventCallback(() => setLocalExpanded((prev) => !prev), []);
  const onPinClick = useSwallowEventCallback(() => globalFilter.set("word", verb.id), [globalFilter, verb]);

  return (
    <div className={["word", expanded ? "expanded" : ""].join(" ")}>
      <div className="word__header">
        <a href="#" className="armenian" onClick={onPinClick}><Text t={verb.infinitive.armenian} /></a>
        {verb.infinitive.transcription && <span className="transcription"><Text t={verb.infinitive.transcription} /></span>}
        <span className="translation"><Text t={verb.infinitive} /></span>
        {teaser?.form && <span className="teaser"><Text t={teaser.form.armenian} /></span>}
        {teaser?.negative && <span className="teaser negative"><Text t={teaser.negative.armenian} /></span>}
        {verb.comment?.[language] && <span className="comment">(<Text t={verb.comment} />)</span>}
        <span className="actions">
          <a href="#" className="expand" aria-label="развернуть" onClick={onExpandClick}><IconExpand /></a>
        </span>
      </div>

      {expanded && <VerbTable verb={verb} tenseId={tense.id} />}
    </div>
  );
}
