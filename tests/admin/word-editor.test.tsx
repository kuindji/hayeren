import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { WordsPage, compactWord } from "@/admin/pages/WordsPage";
import { AdminDataContext } from "@/admin/contexts";
import { buildDataFiles } from "@/data/loader";
import { vi } from "vitest";

const data = buildDataFiles({
  "/data/declensions.json": [{ id: "ա", name: { russian: "ա" } }],
  "/data/cases/nominative.json": { id: "nominative", position: 0, name: { russian: "Им" } },
  "/data/cases/possessive.json": { id: "possessive", position: 1, name: { russian: "Род" } },
  "/data/nouns/table.json": { id: "table", cases: [{ case: "nominative", single: { russian: "стол", armenian: "սեղան" } }] },
  "/data/prepostpositions/for.json": { id: "for", cases: [] },
});

afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

it("edits the possessive singular of a noun and PUTs the whole word", async () => {
  const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ ok: true }) });
  vi.stubGlobal("fetch", fetchMock);
  render(<AdminDataContext.Provider value={data}><WordsPage type="noun" title="Существительные" /></AdminDataContext.Provider>);
  fireEvent.click(screen.getByText("стол"));
  fireEvent.click(screen.getByRole("tab", { name: "Род" }));
  // getAllBy...[0]: a noun case tab shows singular and plural forms, both with a "Հայերեն" field; the singular comes first.
  fireEvent.change(screen.getAllByPlaceholderText("Հայերեն")[0]!, { target: { value: "սեղանի" } });
  fireEvent.change(screen.getByRole("combobox", { name: "Склонение" }), { target: { value: "ա" } });
  fireEvent.click(screen.getByText("Сохранить"));
  await waitFor(() => expect(fetchMock).toHaveBeenCalled());
  const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
  expect(url).toBe("/api/words/nouns/table");
  expect(init.method).toBe("PUT");
  expect(JSON.parse(init.body as string)).toEqual({
    id: "table",
    cases: [
      { case: "nominative", single: { russian: "стол", armenian: "սեղան" } },
      { case: "possessive", declension: "ա", single: { armenian: "սեղանի" } },
    ],
  });
});

describe("compactWord", () => {
  it("keeps the required cases array on a brand-new word", () => {
    expect(compactWord({ id: "new-word", cases: [] })).toEqual({ id: "new-word", cases: [] });
  });

  it("removes empty strings, empty objects, empty examples and bare case entries", () => {
    expect(
      compactWord({
        id: "w",
        comment: { russian: "" },
        description: { russian: "desc", english: "" },
        cases: [
          { case: "nominative", declension: "", single: { armenian: "", russian: "x", comment: { russian: "", english: "" } }, plural: { armenian: "" }, examples: [{ armenian: "", pposition: "" }] },
          { case: "possessive", single: { comment: {} } },
        ],
      }),
    ).toEqual({ id: "w", description: { russian: "desc" }, cases: [{ case: "nominative", single: { russian: "x" } }] });
  });
});

it("adds a new word as { id, cases: [] }", async () => {
  const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ ok: true }) });
  vi.stubGlobal("fetch", fetchMock);
  render(<AdminDataContext.Provider value={data}><WordsPage type="noun" title="Существительные" /></AdminDataContext.Provider>);
  fireEvent.change(screen.getByPlaceholderText("Идентификатор нового слова"), { target: { value: "chair" } });
  fireEvent.click(screen.getByText("Добавить"));
  await waitFor(() => expect(fetchMock).toHaveBeenCalled());
  const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
  expect(url).toBe("/api/words/nouns/chair");
  expect(init.method).toBe("PUT");
  expect(JSON.parse(init.body as string)).toEqual({ id: "chair", cases: [] });
});

it("never sends empty strings for a field typed and then cleared", async () => {
  const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ ok: true }) });
  vi.stubGlobal("fetch", fetchMock);
  render(<AdminDataContext.Provider value={data}><WordsPage type="noun" title="Существительные" /></AdminDataContext.Provider>);
  fireEvent.click(screen.getByText("стол"));
  const [comment] = screen.getAllByPlaceholderText("Комментарий");
  fireEvent.change(comment!, { target: { value: "x" } });
  fireEvent.change(comment!, { target: { value: "" } });
  const [transcription] = screen.getAllByPlaceholderText("Транскрипция");
  fireEvent.change(transcription!, { target: { value: "seghan" } });
  fireEvent.click(screen.getByText("Сохранить"));
  await waitFor(() => expect(fetchMock).toHaveBeenCalled());
  const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
  expect(init.body as string).not.toContain('""');
  expect(JSON.parse(init.body as string)).toEqual({
    id: "table",
    cases: [{ case: "nominative", single: { russian: "стол", armenian: "սեղան", transcription: "seghan" } }],
  });
  expect(await screen.findByText("Сохранено")).toBeInTheDocument();
});

it("shows a failed save's error, not Сохранено, and keeps the draft", async () => {
  const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 400, json: () => ({ error: "cases.0.case: slug must be lowercase kebab-case" }) });
  vi.stubGlobal("fetch", fetchMock);
  render(<AdminDataContext.Provider value={data}><WordsPage type="noun" title="Существительные" /></AdminDataContext.Provider>);
  fireEvent.click(screen.getByText("стол"));
  const [transcription] = screen.getAllByPlaceholderText("Транскрипция");
  fireEvent.change(transcription!, { target: { value: "seghan" } });
  fireEvent.click(screen.getByText("Сохранить"));
  expect(await screen.findByText(/cases\.0\.case: slug must be lowercase kebab-case/)).toBeInTheDocument();
  expect(screen.queryByText("Сохранено")).not.toBeInTheDocument();
  expect(screen.getAllByPlaceholderText("Транскрипция")[0]).toHaveValue("seghan");
});

it("shows the name field on a prepostposition's info tab and hides plural and the prepostposition selector on its case tab", () => {
  render(<AdminDataContext.Provider value={data}><WordsPage type="prepostposition" title="Пре/послелоги" /></AdminDataContext.Provider>);
  fireEvent.click(screen.getByText("for"));
  fireEvent.click(screen.getByRole("tab", { name: "Общая информация" }));
  expect(screen.getByLabelText("Название (armenian)")).toBeInTheDocument();
  expect(screen.getByLabelText("Название (russian)")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("tab", { name: "Им" }));
  expect(screen.getAllByPlaceholderText("Հայերեն")).toHaveLength(1);
  expect(screen.queryByRole("combobox", { name: "Склонение" })).not.toBeInTheDocument();
  fireEvent.click(screen.getByText("Добавить пример"));
  expect(screen.queryByRole("combobox", { name: "Послелог" })).not.toBeInTheDocument();
});

it("refuses to add an id that already exists instead of overwriting the word", () => {
  const fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  render(<AdminDataContext.Provider value={data}><WordsPage type="noun" title="Существительные" /></AdminDataContext.Provider>);
  fireEvent.change(screen.getByPlaceholderText("Идентификатор нового слова"), { target: { value: "table" } });
  fireEvent.click(screen.getByText("Добавить"));
  expect(fetchMock).not.toHaveBeenCalled();
  expect(screen.getByRole("alert")).toHaveTextContent("Слово с таким идентификатором уже существует");
});

it("adds an example with a prepostposition and saves the word right away", async () => {
  const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ ok: true }) });
  vi.stubGlobal("fetch", fetchMock);
  render(<AdminDataContext.Provider value={data}><WordsPage type="noun" title="Существительные" /></AdminDataContext.Provider>);
  fireEvent.click(screen.getByText("стол"));
  fireEvent.click(screen.getByText("Добавить пример"));
  fireEvent.change(screen.getByRole("combobox", { name: "Послелог" }), { target: { value: "for" } });
  // The example form's fields come after the singular and plural forms.
  fireEvent.change(screen.getAllByPlaceholderText("Русский язык")[2]!, { target: { value: "для стола" } });
  fireEvent.click(screen.getAllByText("Сохранить")[1]!);
  await waitFor(() => expect(fetchMock).toHaveBeenCalled());
  const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
  expect(JSON.parse(init.body as string)).toEqual({
    id: "table",
    cases: [{ case: "nominative", single: { russian: "стол", armenian: "սեղան" }, examples: [{ russian: "для стола", pposition: "for" }] }],
  });
});

it("closes an open example form when switching case tabs, so it cannot save into another case", () => {
  const withExample = buildDataFiles({
    "/data/declensions.json": [],
    "/data/cases/nominative.json": { id: "nominative", position: 0, name: { russian: "Им" } },
    "/data/cases/possessive.json": { id: "possessive", position: 1, name: { russian: "Род" } },
    "/data/nouns/table.json": { id: "table", cases: [
      { case: "nominative", single: { russian: "стол" }, examples: [{ russian: "пример им" }] },
      { case: "possessive", single: { russian: "стола" }, examples: [{ russian: "пример род" }] },
    ] },
  });
  const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ ok: true }) });
  vi.stubGlobal("fetch", fetchMock);
  render(<AdminDataContext.Provider value={withExample}><WordsPage type="noun" title="Существительные" /></AdminDataContext.Provider>);
  fireEvent.click(screen.getByText("стол"));
  fireEvent.click(screen.getByText("Изменить"));
  fireEvent.click(screen.getByRole("tab", { name: "Род" }));
  expect(screen.queryByText("Отменить")).not.toBeInTheDocument();
  expect(screen.getByText("пример род")).toBeInTheDocument();
});
