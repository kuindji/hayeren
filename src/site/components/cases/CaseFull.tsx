import { useMemo } from "react";
import { createFilter } from "@/model/filter";
import { Text } from "@/shared/Text";
import { CaseContext, LocalFilterContext } from "../../contexts";
import { useCombinedFilterData, useFilter, useFilterKey, useGet, useLanguage } from "../../hooks";
import { Words } from "../Words";
import { Article } from "./Article";
import { Declensions } from "./Declensions";
import { QuestionGroups } from "./QuestionGroups";

export function CaseFull({ id }: { id: string }) {
  const lcase = useGet("case", id);
  if (!lcase) throw new Error(`case "${id}" not found`);
  const globalFilter = useFilter();
  const language = useLanguage();
  const wordId = useFilterKey("word");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const localFilter = useMemo(() => createFilter({ language }), []);
  const filterData = useCombinedFilterData(globalFilter, localFilter);
  const data = useMemo(() => lcase.getData(filterData), [lcase, filterData]);

  return (
    <CaseContext.Provider value={lcase}>
      <LocalFilterContext.Provider value={localFilter}>
        <div className="full-case">
          <div className="full-case__header">
            <h2><Text t={data.name} /></h2>
            {data.description && <p className="description"><Text t={data.description} /></p>}
          </div>
          {data.articles.length > 0 && (
            <div className="full-case__articles">
              {data.articles.map((a) => <Article key={a.id} article={a} />)}
            </div>
          )}
          {!wordId && <QuestionGroups questionGroups={data.questionGroups} />}
          <Words words={data.pronouns} title="Местоимения" limit={10} />
          <Words words={data.nouns} title="Существительные" comment="регулярные" />
          <Declensions declensions={data.declensions} />
          {data.wordGroups.map((g, inx) => (
            <Words className="full-case__group" key={inx} words={g.words} title={g.name} />
          ))}
          <Words words={data.numerals} title="Числительные" />
          <Words words={data.questionWords} title="Вопросительные слова" />
          <Words words={data.prepostpositions} title="Послелоги" comment="у которых есть падежи" />
        </div>
      </LocalFilterContext.Provider>
    </CaseContext.Provider>
  );
}
