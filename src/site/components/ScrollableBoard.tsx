import { useMemo, useRef, type ReactNode } from "react";
import { useSwallowEventCallback } from "@/shared/hooks/useSwallowEventCallback";

/** The horizontally scrolling column strip shared by the case and tense boards, with arrows on non-Mac (no trackpad). */
export function ScrollableBoard({ children }: { children: ReactNode }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isMac = useMemo(() => navigator.platform.includes("Mac"), []);
  const scrollBy = (dir: -1 | 1) => scrollRef.current?.scrollBy({ left: (dir * document.documentElement.offsetWidth) / 4, behavior: "smooth" });
  const onScrollLeft = useSwallowEventCallback(() => scrollBy(-1), []);
  const onScrollRight = useSwallowEventCallback(() => scrollBy(1), []);
  return (
    <>
      {!isMac && (
        <div className="full-case-list-scroll-actions">
          <a href="#" onClick={onScrollLeft}>←</a>
          <a href="#" onClick={onScrollRight}>→</a>
        </div>
      )}
      <div className="full-case-list-scrollable" ref={scrollRef}>
        <div className="full-case-list">{children}</div>
      </div>
    </>
  );
}
