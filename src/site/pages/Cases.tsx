import { useCallback, useMemo, useRef } from "react";
import { useDatabase, useFilter, useFilterData, useQuery } from "../hooks";
import { CaseFull } from "../components/cases/CaseFull";
import { Search } from "../components/Search";
import { useSwallowEventCallback } from "@/shared/hooks/useSwallowEventCallback";

export function Cases() {
  const db = useDatabase();
  const globalFilter = useFilter();
  const filterData = useFilterData(globalFilter);
  const allCases = useQuery("case");
  const scrollRef = useRef<HTMLDivElement>(null);
  const cases = useMemo(() => allCases.filter((c) => c.matchesFilter(filterData)), [allCases, filterData]);
  const pinnedLabel = useCallback((id: string) => db.findWord(id)?.nominative().armenian, [db]);
  const isMac = useMemo(() => navigator.platform.includes("Mac"), []);
  const scrollBy = (dir: -1 | 1) => scrollRef.current?.scrollBy({ left: (dir * document.documentElement.offsetWidth) / 4, behavior: "smooth" });
  const onScrollLeft = useSwallowEventCallback(() => scrollBy(-1), []);
  const onScrollRight = useSwallowEventCallback(() => scrollBy(1), []);
  return (
    <>
      <Search pinnedLabel={pinnedLabel} />
      {!isMac && (
        <div className="full-case-list-scroll-actions">
          <a href="#" onClick={onScrollLeft}>←</a>
          <a href="#" onClick={onScrollRight}>→</a>
        </div>
      )}
      <div className="full-case-list-scrollable" ref={scrollRef}>
        <div className="full-case-list">{cases.map((c) => <CaseFull key={c.id} id={c.id} />)}</div>
      </div>
    </>
  );
}
