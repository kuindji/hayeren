import { useState } from "react";
import { NavLink, useLocation } from "react-router";
import { useSwallowEventCallback } from "@/shared/hooks/useSwallowEventCallback";
import { IconBurger } from "@/shared/icons";

export function ChaptersMenu() {
  const [active, setActive] = useState(false);

  const toggleActive = useSwallowEventCallback(() => setActive((prev) => !prev), []);

  const route = useLocation().pathname;
  const activeIf = (path: string) => (route === path ? "active" : undefined);

  return (
    <nav id="chapters-menu" className={active ? "active" : ""} onClick={toggleActive}>
      <a href="/#" id="chapters-menu-burger">
        <IconBurger />
      </a>
      <ul>
        <li className={activeIf("/alphabet")}>
          <NavLink to="/alphabet">Алфавит</NavLink>
        </li>
        <li className={activeIf("/pronouns")}>
          <NavLink to="/pronouns" className="disabled">Местоимения</NavLink>
        </li>
        <li className={activeIf("/numeral")}>
          <NavLink to="/numeral" className="disabled">Числительные</NavLink>
        </li>
        <li className={activeIf("/questions")}>
          <NavLink to="/questions" className="disabled">Вопросительные слова</NavLink>
        </li>
        <li className={activeIf("/cases")}>
          <NavLink to="/cases">Падежи</NavLink>
        </li>
        <li className={activeIf("/tenses")}>
          <NavLink to="/tenses" className="disabled">Времена глаголов</NavLink>
        </li>
      </ul>
    </nav>
  );
}
