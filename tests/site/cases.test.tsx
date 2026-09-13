import { render, screen, fireEvent, within } from "@testing-library/react";
import App from "@/site/App";

import { createMemoryRouter } from "react-router";
import { routes } from "@/site/App";

async function renderCases() {
  render(<App router={createMemoryRouter(routes, { initialEntries: ["/cases"] })} />);
  await screen.findByPlaceholderText("Поиск");
}

it("shows one column per case in position order with a searchable word list", async () => {
  await renderCases();
  const headings = screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent);
  expect(headings[0]).toBe("Именительный падеж");
  expect(headings[1]).toBe("Родительный падеж");
  expect(headings).toHaveLength(6);
});

it("search narrows the columns and their words", async () => {
  await renderCases();
  fireEvent.change(screen.getByPlaceholderText("Поиск"), { target: { value: "сегхан" } });
  expect(screen.queryAllByRole("heading", { level: 2 })).toHaveLength(0);
  fireEvent.change(screen.getByPlaceholderText("Поиск"), { target: { value: "стол" } });
  const columns = screen.getAllByRole("heading", { level: 2 });
  expect(columns.length).toBeGreaterThanOrEqual(2);
  expect(screen.getAllByText("սեղան").length).toBeGreaterThan(0);
});

it("clicking a nominative word pins every column to it and shows it in the search bar", async () => {
  await renderCases();
  const nominativeColumn = screen.getAllByRole("heading", { level: 2 })[0]!.closest<HTMLElement>(".full-case")!;
  // Nouns are listed by id with a limit of 5, so "table" sits behind the list's expand chevron.
  const nouns = within(nominativeColumn).getByRole("heading", { level: 3, name: /Существительные/ }).closest<HTMLElement>(".word-list")!;
  expect(within(nominativeColumn).queryByText("սեղան")).not.toBeInTheDocument();
  fireEvent.click(nouns.querySelector(".more")!);
  fireEvent.click(within(nominativeColumn).getByText("սեղան"));
  expect(screen.getByText("սեղան", { selector: ".search-word *" })).toBeInTheDocument();
  expect(screen.getAllByText("стол").length).toBeGreaterThan(0);
});

it("clicking a question filters examples by prepostposition", async () => {
  await renderCases();
  const possessive = screen.getAllByRole("heading", { level: 2 })[1]!.closest<HTMLElement>(".full-case")!;
  fireEvent.click(within(possessive).getByText("для чегó"));
  expect(within(possessive).getByText("для чегó").closest("li")).toHaveClass("active");
  expect(within(possessive).getAllByText(/համար/).length).toBeGreaterThan(0);
});

it("nominative кто/что are plain labels: clicking them highlights nothing and filters nothing", async () => {
  await renderCases();
  const nominative = screen.getAllByRole("heading", { level: 2 })[0]!.closest<HTMLElement>(".full-case")!;
  // "что" is also a word translation further down the column, so look questions up inside the questions block.
  const questions = nominative.querySelector<HTMLElement>(".full-case__questions")!;
  const words = () => Array.from(nominative.querySelectorAll(".word"), (w) => w.textContent);
  const wordsBefore = words();
  expect(wordsBefore.length).toBeGreaterThan(0);
  for (const clicked of ["кто", "что"]) {
    fireEvent.click(within(questions).getByText(clicked));
    for (const q of ["кто", "что"]) {
      const li = within(questions).getByText(q).closest("li")!;
      expect(li).not.toHaveClass("active");
      expect(li).not.toHaveClass("clickable");
      expect(within(li).queryByRole("link")).not.toBeInTheDocument();
    }
    expect(words()).toEqual(wordsBefore);
  }
});
