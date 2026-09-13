import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
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

// ---- Fix round 1 ----

const tableData = (single: Record<string, string>, examples?: object[], extraCases: object[] = []) => buildDataFiles({
  "/data/declensions.json": [],
  "/data/cases/nominative.json": { id: "nominative", position: 0, name: { russian: "Им" } },
  "/data/cases/possessive.json": { id: "possessive", position: 1, name: { russian: "Род" } },
  "/data/nouns/table.json": { id: "table", cases: [{ case: "nominative", single, ...(examples ? { examples } : {}) }, ...extraCases] },
});
const page = (files: ReturnType<typeof buildDataFiles>) => (
  <AdminDataContext.Provider value={files}><WordsPage type="noun" title="Существительные" /></AdminDataContext.Provider>
);
const okFetch = () => vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ ok: true }) });
const bodyOf = (fetchMock: ReturnType<typeof vi.fn>, call = 0) =>
  JSON.parse((fetchMock.mock.calls[call] as [string, RequestInit])[1].body as string) as { cases: { case: string; single?: object; examples?: object[] }[] };
const CONFLICT = "Слово изменилось на диске. Перезагрузите его, чтобы не потерять изменения.";

describe("external data changes for the open word (finding 1)", () => {
  it("adopts newer on-disk content silently when there are no unsaved edits, and the next save sends it", async () => {
    const fetchMock = okFetch();
    vi.stubGlobal("fetch", fetchMock);
    const { rerender } = render(page(tableData({ russian: "стол" })));
    fireEvent.click(screen.getByText("стол"));
    rerender(page(tableData({ russian: "стол", english: "table" })));
    expect(screen.getAllByPlaceholderText("English")[0]).toHaveValue("table");
    expect(screen.queryByText(CONFLICT)).not.toBeInTheDocument();
    fireEvent.click(screen.getByText("Сохранить"));
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(bodyOf(fetchMock).cases[0]!.single).toEqual({ russian: "стол", english: "table" });
  });

  it("shows a conflict and blocks saving when there are unsaved edits; reloading adopts the new data", () => {
    const fetchMock = okFetch();
    vi.stubGlobal("fetch", fetchMock);
    const { rerender } = render(page(tableData({ russian: "стол" })));
    fireEvent.click(screen.getByText("стол"));
    fireEvent.change(screen.getAllByPlaceholderText("Транскрипция")[0]!, { target: { value: "seghan" } });
    rerender(page(tableData({ russian: "стол", english: "table" })));
    expect(screen.getByText(CONFLICT)).toBeInTheDocument();
    expect(screen.getByText("Сохранить")).toBeDisabled();
    fireEvent.click(screen.getByText("Сохранить"));
    expect(fetchMock).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText("Перезагрузить слово"));
    expect(screen.queryByText(CONFLICT)).not.toBeInTheDocument();
    expect(screen.getAllByPlaceholderText("English")[0]).toHaveValue("table");
    expect(screen.getAllByPlaceholderText("Транскрипция")[0]).toHaveValue("");
    expect(screen.getByText("Сохранить")).toBeEnabled();
  });

  it("does not report a conflict for the editor's own save echoed back by HMR, even with edits made after the save", async () => {
    const fetchMock = okFetch();
    vi.stubGlobal("fetch", fetchMock);
    const { rerender } = render(page(tableData({ russian: "стол" })));
    fireEvent.click(screen.getByText("стол"));
    fireEvent.change(screen.getAllByPlaceholderText("English")[0]!, { target: { value: "table" } });
    fireEvent.click(screen.getByText("Сохранить"));
    expect(await screen.findByText("Сохранено")).toBeInTheDocument();
    fireEvent.change(screen.getAllByPlaceholderText("Транскрипция")[0]!, { target: { value: "seghan" } });
    rerender(page(tableData({ russian: "стол", english: "table" })));
    expect(screen.queryByText(CONFLICT)).not.toBeInTheDocument();
    expect(screen.getAllByPlaceholderText("Транскрипция")[0]).toHaveValue("seghan");
    expect(screen.getByText("Сохранить")).toBeEnabled();
  });
});

describe("overlapping saves (finding 2)", () => {
  it("never shows Сохранено next to an error: a later failed save clears the earlier success", async () => {
    const resolvers: ((v: unknown) => void)[] = [];
    vi.stubGlobal("fetch", vi.fn().mockImplementation(() => new Promise((r) => resolvers.push(r))));
    render(page(tableData({ russian: "стол" })));
    fireEvent.click(screen.getByText("стол"));
    fireEvent.click(screen.getAllByText("Сохранить")[0]!); // case save, in flight
    fireEvent.click(screen.getByText("Добавить пример"));
    fireEvent.change(screen.getAllByPlaceholderText("Русский язык")[2]!, { target: { value: "E" } });
    expect(screen.getAllByText("Сохранить")[1]).toBeDisabled(); // example save cannot overlap
    await act(async () => { resolvers[0]!({ ok: true, json: () => Promise.resolve({}) }); await Promise.resolve(); });
    expect(screen.getByText("Сохранено")).toBeInTheDocument();
    fireEvent.click(screen.getAllByText("Сохранить")[1]!); // example save starts only now
    await act(async () => { resolvers[1]!({ ok: false, status: 400, json: () => Promise.resolve({ error: "boom" }) }); await Promise.resolve(); });
    expect(screen.getByRole("alert")).toHaveTextContent("boom");
    expect(screen.queryByText("Сохранено")).not.toBeInTheDocument();
    expect(resolvers).toHaveLength(2);
  });

  it("sends a single PUT when an example is saved while a save is in flight", async () => {
    let resolve!: (v: unknown) => void;
    const fetchMock = vi.fn().mockImplementation(() => new Promise((r) => { resolve = r; }));
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(page(tableData({ russian: "стол" }, [{ russian: "A" }])));
    fireEvent.click(screen.getByText("стол"));
    fireEvent.click(screen.getAllByText("Сохранить")[0]!);
    expect(screen.getAllByText("Сохранить")[0]).toBeDisabled();
    expect(screen.getByText("Удалить")).toBeDisabled();
    fireEvent.click(screen.getByText("Удалить"));
    fireEvent.click(screen.getByText("Добавить пример"));
    fireEvent.change(screen.getAllByPlaceholderText("Русский язык")[2]!, { target: { value: "E" } });
    fireEvent.click(screen.getAllByText("Сохранить")[1]!);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await act(async () => { resolve({ ok: true, json: () => Promise.resolve({}) }); await Promise.resolve(); });
  });

  it("disables Удалить слово while a save is in flight", async () => {
    let resolve!: (v: unknown) => void;
    vi.stubGlobal("fetch", vi.fn().mockImplementation(() => new Promise((r) => { resolve = r; })));
    render(page(tableData({ russian: "стол" })));
    fireEvent.click(screen.getByText("стол"));
    fireEvent.click(screen.getByRole("tab", { name: "Общая информация" }));
    fireEvent.click(screen.getByText("Сохранить"));
    expect(screen.getByText("Удалить слово")).toBeDisabled();
    await act(async () => { resolve({ ok: true, json: () => Promise.resolve({}) }); await Promise.resolve(); });
    expect(screen.getByText("Удалить слово")).toBeEnabled();
  });
});

describe("examples editing (M1, M3)", () => {
  it("keeps the edited row open and aligned when an earlier row is deleted, then saves the edit into the right row", async () => {
    // Adapted from the reviewer's "edit row 1, delete row 0 while editing" test: per M1 the open form now stays open.
    const fetchMock = okFetch();
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(page(tableData({ russian: "стол" }, [{ russian: "A" }, { russian: "B" }, { russian: "C" }])));
    fireEvent.click(screen.getByText("стол"));
    fireEvent.click(screen.getAllByText("Изменить")[1]!); // edit B
    fireEvent.click(screen.getAllByText("Удалить")[0]!); // delete A while B is open
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(bodyOf(fetchMock).cases[0]!.examples).toEqual([{ russian: "B" }, { russian: "C" }]);
    await waitFor(() => expect(screen.getAllByText("Сохранить")[1]).toBeEnabled());
    const inputs = screen.getAllByPlaceholderText("Русский язык");
    expect(inputs[2]).toHaveValue("B"); // the open form still edits B
    fireEvent.change(inputs[2]!, { target: { value: "B2" } });
    fireEvent.click(screen.getAllByText("Сохранить")[1]!);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(bodyOf(fetchMock, 1).cases[0]!.examples).toEqual([{ russian: "B2" }, { russian: "C" }]);
  });

  it("keeps a typed new example when a row is deleted", async () => {
    const fetchMock = okFetch();
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(page(tableData({ russian: "стол" }, [{ russian: "A" }, { russian: "B" }])));
    fireEvent.click(screen.getByText("стол"));
    fireEvent.click(screen.getByText("Добавить пример"));
    fireEvent.change(screen.getAllByPlaceholderText("Русский язык")[2]!, { target: { value: "NEW" } });
    fireEvent.click(screen.getAllByText("Удалить")[0]!);
    expect(screen.getByDisplayValue("NEW")).toBeInTheDocument();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(bodyOf(fetchMock).cases[0]!.examples).toEqual([{ russian: "B" }]);
  });

  it("deletes an example after confirmation and saves the word", async () => {
    const fetchMock = okFetch();
    vi.stubGlobal("fetch", fetchMock);
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    render(page(tableData({ russian: "стол" }, [{ russian: "A" }, { russian: "B" }])));
    fireEvent.click(screen.getByText("стол"));
    fireEvent.click(screen.getAllByText("Удалить")[0]!);
    expect(confirm).toHaveBeenCalled();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(bodyOf(fetchMock).cases[0]!.examples).toEqual([{ russian: "B" }]);
    expect(screen.queryByText("A")).not.toBeInTheDocument();
  });
});

describe("Удалить слово (M3)", () => {
  it("DELETEs the word after confirmation and closes the editor", async () => {
    const fetchMock = okFetch();
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(page(tableData({ russian: "стол" })));
    fireEvent.click(screen.getByText("стол"));
    fireEvent.click(screen.getByRole("tab", { name: "Общая информация" }));
    fireEvent.click(screen.getByText("Удалить слово"));
    await waitFor(() => expect(screen.queryByText("Удалить слово")).not.toBeInTheDocument());
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/words/nouns/table");
    expect(init.method).toBe("DELETE");
  });

  it("shows a failed delete's error and keeps the editor open", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 404, json: () => ({ error: "not found" }) }));
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(page(tableData({ russian: "стол" })));
    fireEvent.click(screen.getByText("стол"));
    fireEvent.click(screen.getByRole("tab", { name: "Общая информация" }));
    fireEvent.click(screen.getByText("Удалить слово"));
    expect(await screen.findByRole("alert")).toHaveTextContent("Не удалось удалить слово: not found");
    expect(screen.getByText("Удалить слово")).toBeEnabled();
  });
});

it("inserts a newly edited case in case-position order, keeping existing entries in place (M2)", async () => {
  const fetchMock = okFetch();
  vi.stubGlobal("fetch", fetchMock);
  const files = buildDataFiles({
    "/data/declensions.json": [],
    "/data/cases/nominative.json": { id: "nominative", position: 0, name: { russian: "Им" } },
    "/data/cases/possessive.json": { id: "possessive", position: 1, name: { russian: "Род" } },
    "/data/cases/dative.json": { id: "dative", position: 2, name: { russian: "Дат" } },
    "/data/nouns/table.json": { id: "table", cases: [{ case: "dative", single: { russian: "столу" } }, { case: "possessive", single: { russian: "стола" } }] },
  });
  render(page(files));
  fireEvent.click(screen.getByText("table"));
  fireEvent.click(screen.getByRole("tab", { name: "Им" }));
  fireEvent.change(screen.getAllByPlaceholderText("Русский язык")[0]!, { target: { value: "стол" } });
  fireEvent.click(screen.getByText("Сохранить"));
  await waitFor(() => expect(fetchMock).toHaveBeenCalled());
  // nominative goes before the first entry whose case comes later (dative); the existing dative/possessive order is untouched.
  expect(bodyOf(fetchMock).cases.map((c) => c.case)).toEqual(["nominative", "dative", "possessive"]);
});

it("does not report a conflict when HMR echoes the editor's own save before the PUT response arrives (finding 1)", async () => {
  let resolve!: (v: unknown) => void;
  vi.stubGlobal("fetch", vi.fn().mockImplementation(() => new Promise((r) => { resolve = r; })));
  const { rerender } = render(page(tableData({ russian: "стол" })));
  fireEvent.click(screen.getByText("стол"));
  fireEvent.change(screen.getAllByPlaceholderText("English")[0]!, { target: { value: "table" } });
  fireEvent.click(screen.getByText("Сохранить"));
  // The server wrote the file, Vite pushed the update, and only then does the HTTP response resolve.
  rerender(page(tableData({ russian: "стол", english: "table" })));
  expect(screen.queryByText(CONFLICT)).not.toBeInTheDocument();
  await act(async () => { resolve({ ok: true, json: () => Promise.resolve({}) }); await Promise.resolve(); });
  expect(screen.getByText("Сохранено")).toBeInTheDocument();
  expect(screen.queryByText(CONFLICT)).not.toBeInTheDocument();
  expect(screen.getByText("Сохранить")).toBeEnabled();
});
