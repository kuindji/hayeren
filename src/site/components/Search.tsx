import { useCallback } from "react";
import { IconClose } from "@/shared/icons";
import { Text } from "@/shared/Text";
import { useSwallowEventCallback } from "@/shared/hooks/useSwallowEventCallback";
import { useFilter, useFilterKey, useWordById } from "../hooks";
import { SearchField } from "./SearchField";

export function Search() {
  const filter = useFilter();
  const query = useFilterKey("query");
  const wordId = useFilterKey("word");
  const word = useWordById(wordId);
  const onWordClearClick = useSwallowEventCallback(() => filter.set("word", null), [filter]);
  const onChange = useCallback((value: string) => filter.set("query", value), [filter]);
  const before = word ? (
    <div className="search-word">
      {/* Brief test: the pinned word shows its Armenian nominative in an element (the old site showed the Russian). */}
      <span><Text t={word.nominative().armenian} /></span>
      <a href="#" onClick={onWordClearClick}><IconClose /></a>
    </div>
  ) : null;
  return (
    <div className="search">
      <SearchField before={before} placeholder="Поиск" value={query ?? ""} onChange={onChange} />
    </div>
  );
}
