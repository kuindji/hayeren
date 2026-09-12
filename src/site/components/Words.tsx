import { useMemo, useState, type ElementType } from "react";
import type { Localized } from "@/data/schema";
import type { Word as WordEntity } from "@/model/Word";
import { IconExpand } from "@/shared/icons";
import { Text } from "@/shared/Text";
import { useSwallowEventCallback } from "@/shared/hooks/useSwallowEventCallback";
import { Word } from "./Word";

interface WordsProps {
  words: WordEntity[];
  title?: string | Localized | undefined;
  comment?: string | Localized | undefined;
  limit?: number;
  Header?: ElementType;
  className?: string;
}

export function Words({ words, title, comment, limit = 5, Header = "h3", className = "" }: WordsProps) {
  // Derived rather than state + useUpdateEffect: same result, and no stale first render when words change.
  const first = useMemo(() => words.slice(0, limit), [words, limit]);
  const hasMore = words.length > limit;
  const [expanded, setExpanded] = useState(false);
  const onExpandToggle = useSwallowEventCallback(() => setExpanded((prev) => !prev), []);
  const cls = ["word-list", className, expanded ? "expanded" : ""].join(" ");

  if (first.length === 0) return null;

  return (
    <div className={cls}>
      {title && (
        <Header>
          <Text t={title} />
          {comment ? <span className="comment">(<Text t={comment} />)</span> : null}
        </Header>
      )}
      {(expanded ? words : first).map((w) => <Word key={w.id} word={w} />)}
      {hasMore && (
        <a href="#" className="more" onClick={onExpandToggle}>
          <IconExpand />
        </a>
      )}
    </div>
  );
}
