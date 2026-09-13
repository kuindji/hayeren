import { useCallback, useMemo } from "react";
import { useDatabase, useFilter, useFilterData, useQuery } from "../hooks";
import { CaseFull } from "../components/cases/CaseFull";
import { ScrollableBoard } from "../components/ScrollableBoard";
import { Search } from "../components/Search";

export function Cases() {
  const db = useDatabase();
  const globalFilter = useFilter();
  const filterData = useFilterData(globalFilter);
  const allCases = useQuery("case");
  const cases = useMemo(() => allCases.filter((c) => c.matchesFilter(filterData)), [allCases, filterData]);
  const pinnedLabel = useCallback((id: string) => db.findWord(id)?.nominative().armenian, [db]);
  return (
    <>
      <Search pinnedLabel={pinnedLabel} />
      <ScrollableBoard>{cases.map((c) => <CaseFull key={c.id} id={c.id} />)}</ScrollableBoard>
    </>
  );
}
