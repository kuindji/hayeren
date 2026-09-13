import { render, screen, fireEvent, within } from "@testing-library/react";
import { createMemoryRouter } from "react-router";
import App, { routes } from "@/site/App";

async function renderTenses() {
  render(<App router={createMemoryRouter(routes, { initialEntries: ["/tenses"] })} />);
  await screen.findByPlaceholderText("Поиск");
}
const columns = () => screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent);

it("shows one column per tense in position order", async () => {
  await renderTenses();
  const heads = columns();
  expect(heads).toHaveLength(14);
  expect(heads[0]).toBe("Настоящее");
  expect(heads[13]).toBe("Прошедшее совершенное (аорист)");
});

it("a collapsed verb row shows the infinitive and the first-person teaser; expanding shows the person table", async () => {
  await renderTenses();
  const aorist = screen.getByText("Прошедшее совершенное (аорист)").closest<HTMLElement>(".full-case")!;
  const row = within(aorist).getByText("խմել").closest<HTMLElement>(".word")!;
  expect(row).toHaveTextContent("խմեցի");
  expect(row).toHaveTextContent("չխմեցի");
  expect(within(row).queryByRole("table")).toBeNull();
  fireEvent.click(within(row).getByRole("link", { name: /развернуть/i }));
  const table = within(row).getByRole("table");
  expect(within(table).getAllByRole("row")).toHaveLength(7); // header + 6 persons
  expect(within(table).getByText("նրանք").closest("tr")).toHaveTextContent("խմեցին");
  expect(within(table).getByText("նրանք").closest("tr")).toHaveTextContent("չխմեցին");
});

it("the imperative table lists only the persons that exist and shows informal variants", async () => {
  await renderTenses();
  const imperative = screen.getByText("Повелительное").closest<HTMLElement>(".full-case")!;
  const row = within(imperative).getByText("խմել").closest<HTMLElement>(".word")!;
  fireEvent.click(within(row).getByRole("link", { name: /развернуть/i }));
  const rows = within(within(row).getByRole("table")).getAllByRole("row");
  expect(rows).toHaveLength(3);
  expect(rows[1]).toHaveTextContent("դու");
  expect(rows[1]).toHaveTextContent("խմի՛ր");
  expect(rows[1]).toHaveTextContent("խմի");
  expect(rows[1]).toHaveTextContent("մի՛ խմիր");
});

it("clicking the infinitive pins the verb: every column shows only it, expanded, and the chip shows the infinitive", async () => {
  await renderTenses();
  fireEvent.click(screen.getAllByRole("link", { name: "գալ" })[0]!);
  expect(columns()).toHaveLength(6); // present, imperfect, perfect, pluperfect, imperative, aorist
  expect(screen.getAllByRole("table")).toHaveLength(6);
  expect(document.querySelector(".search-word")).toHaveTextContent("գալ");
  expect(screen.queryByText("խմել")).toBeNull();
});

it("search narrows the board to tenses with a matching verb, matching stress-marked forms without the mark", async () => {
  await renderTenses();
  fireEvent.change(screen.getByPlaceholderText("Поиск"), { target: { value: "խմիր" } });
  expect(columns()).toEqual(expect.arrayContaining(["Повелительное"]));
  expect(screen.queryByText("Настоящее")).toBeNull();
  fireEvent.change(screen.getByPlaceholderText("Поиск"), { target: { value: "утюг" } });
  expect(screen.queryAllByRole("heading", { level: 2 })).toHaveLength(0);
});

it("irregular verbs sit under Исключения and the conjugation heading names the class", async () => {
  await renderTenses();
  const perfect = screen.getByText("Перфект").closest<HTMLElement>(".full-case")!;
  expect(within(perfect).getByText("Исключения").closest(".word-list")).toHaveTextContent("գալ");
  const aorist = screen.getByText("Прошедшее совершенное (аорист)").closest<HTMLElement>(".full-case")!;
  // The conjugation heading is the h3 of .full-case__declension; the VerbList inside it has no title of its own.
  expect(within(aorist).getByText("Глаголы на -ել").closest(".full-case__declension")).toHaveTextContent("խմել");
});
