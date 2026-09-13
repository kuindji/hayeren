import { useCallback, useMemo } from "react";
import { createFilter } from "@/model/filter";
import { GlobalFilterContext } from "../contexts";
import { useDatabase, useFilter, useFilterData, useQuery } from "../hooks";
import { ScrollableBoard } from "../components/ScrollableBoard";
import { Search } from "../components/Search";
import { TenseFull } from "../components/tenses/TenseFull";

function Board() {
  const db = useDatabase();
  const globalFilter = useFilter();
  const filterData = useFilterData(globalFilter);
  const allTenses = useQuery("tense");
  const tenses = useMemo(() => allTenses.filter((t) => t.matchesFilter(filterData)), [allTenses, filterData]);
  const pinnedLabel = useCallback((id: string) => db.verb.get(id)?.infinitive.armenian, [db]);
  return (
    <>
      <Search pinnedLabel={pinnedLabel} />
      <ScrollableBoard>{tenses.map((t) => <TenseFull key={t.id} id={t.id} />)}</ScrollableBoard>
    </>
  );
}

export function Tenses() {
  // The tense board has its own filter store: a word pinned on the case board must not filter this page, and verb
  // ids are a separate namespace from word ids. Search reads whatever GlobalFilterContext provides.
  const filter = useMemo(() => createFilter({ language: "russian" }), []);
  return <GlobalFilterContext.Provider value={filter}><Board /></GlobalFilterContext.Provider>;
}
