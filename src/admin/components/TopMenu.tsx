import { NavLink } from "react-router";

const LINKS: [to: string, label: string][] = [
  ["/nouns", "Существительные"],
  ["/pronouns", "Местоимения"],
  ["/numerals", "Числительные"],
  ["/questions", "Вопросительные слова"],
  ["/prepostpositions", "Пре/послелоги"],
];

export function TopMenu() {
  return (
    <nav className="top-menu">
      <ul>
        {LINKS.map(([to, label]) => (
          <li key={to}>
            <NavLink to={to}>{label}</NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
