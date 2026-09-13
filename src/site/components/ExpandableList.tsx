import { Fragment, useMemo, useState, type ElementType, type ReactNode } from "react";
import type { Localized } from "@/data/schema";
import { IconExpand } from "@/shared/icons";
import { Text } from "@/shared/Text";
import { useSwallowEventCallback } from "@/shared/hooks/useSwallowEventCallback";

export interface ExpandableListProps<T> {
  items: T[];
  keyOf: (item: T) => string;
  renderItem: (item: T) => ReactNode;
  title?: string | Localized | undefined;
  comment?: string | Localized | undefined;
  limit?: number;
  Header?: ElementType;
  className?: string;
}

export type ListChrome = Pick<ExpandableListProps<unknown>, "title" | "comment" | "limit" | "Header" | "className">;

export function ExpandableList<T>({ items, keyOf, renderItem, title, comment, limit = 5, Header = "h3", className = "" }: ExpandableListProps<T>) {
  // Derived rather than state + useUpdateEffect: same result, and no stale first render when items change.
  const first = useMemo(() => items.slice(0, limit), [items, limit]);
  const hasMore = items.length > limit;
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
      {(expanded ? items : first).map((item) => <Fragment key={keyOf(item)}>{renderItem(item)}</Fragment>)}
      {hasMore && (
        <a href="#" className="more" onClick={onExpandToggle}>
          <IconExpand />
        </a>
      )}
    </div>
  );
}
