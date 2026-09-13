import { useMemo } from "react";
import { createFilter } from "@/model/filter";
import { Text } from "@/shared/Text";
import { LocalFilterContext, TenseContext } from "../../contexts";
import { useCombinedFilterData, useFilter, useGet, useLanguage } from "../../hooks";
import { Article } from "../cases/Article";
import { VerbList } from "./VerbList";

export function TenseFull({ id }: { id: string }) {
  const tense = useGet("tense", id);
  if (!tense) throw new Error(`tense "${id}" not found`);
  const globalFilter = useFilter();
  const language = useLanguage();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const localFilter = useMemo(() => createFilter({ language }), []);
  const filterData = useCombinedFilterData(globalFilter, localFilter);
  const data = useMemo(() => tense.getData(filterData), [tense, filterData]);

  return (
    <TenseContext.Provider value={tense}>
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
          {data.conjugations.map((c) => (
            <div className="full-case__declension" key={c.id}>
              <h3>
                <Text t={c.name} />
                {c.comment?.[language] && <span className="comment">(<Text t={c.comment} />)</span>}
              </h3>
              <VerbList verbs={c.verbs} Header="h4" />
            </div>
          ))}
          <VerbList verbs={data.irregular} title="Исключения" />
          {data.groups.map((g, inx) => (
            <VerbList className="full-case__group" key={inx} verbs={g.verbs} title={g.name} />
          ))}
        </div>
      </LocalFilterContext.Provider>
    </TenseContext.Provider>
  );
}
