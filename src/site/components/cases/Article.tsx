import { useMemo, useState } from "react";
import { marked } from "marked";
import type { Article as ArticleEntity } from "@/model/Article";
import { IconExpand } from "@/shared/icons";
import { useSwallowEventCallback } from "@/shared/hooks/useSwallowEventCallback";

export function Article({ article }: { article: ArticleEntity }) {
  const [expanded, setExpanded] = useState(false);
  const toggleExpanded = useSwallowEventCallback(() => setExpanded((prev) => !prev), []);
  const html = useMemo(() => marked.parse(article.text, { async: false }), [article]);

  return (
    <div className={"article " + (expanded ? "expanded" : "")}>
      <h3>
        <a href="#" onClick={toggleExpanded}>
          {article.title}
          <IconExpand />
        </a>
      </h3>
      {expanded && <div dangerouslySetInnerHTML={{ __html: html }} />}
    </div>
  );
}
