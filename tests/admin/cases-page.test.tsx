import { render, screen, fireEvent, waitFor, within, act } from "@testing-library/react";
import type { CaseFile } from "@/data/schema";
import { CasesPage } from "@/admin/pages/CasesPage";
import { AdminDataContext } from "@/admin/contexts";
import { buildDataFiles } from "@/data/loader";
import { vi } from "vitest";

const data = buildDataFiles({
  "/data/declensions.json": [{ id: "ա", name: { russian: "ա" } }],
  "/data/cases/possessive.json": { id: "possessive", position: 1, name: { russian: "Род" }, questions: [{ type: "noun", question: { russian: "чего" } }] },
  "/data/nouns/table.json": { id: "table", cases: [{ case: "nominative", single: { russian: "стол" } }] },
  "/data/prepostpositions/for.json": { id: "for", cases: [] },
});

afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

it("adds a question with a prepostposition and saves the whole case", async () => {
  const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ ok: true }) });
  vi.stubGlobal("fetch", fetchMock);
  render(<AdminDataContext.Provider value={data}><CasesPage /></AdminDataContext.Provider>);
  fireEvent.click(screen.getByText("Род"));
  fireEvent.click(screen.getByRole("tab", { name: "Отвечает на вопросы" }));
  fireEvent.click(screen.getByText("Добавить вопрос"));
  const rows = screen.getAllByRole("group", { name: "Вопрос" });
  const row = rows[rows.length - 1]!;
  fireEvent.change(row.querySelector('select[aria-label="Тип"]')!, { target: { value: "noun" } });
  fireEvent.change(row.querySelector('select[aria-label="Послелог"]')!, { target: { value: "for" } });
  fireEvent.change(row.querySelector('input[placeholder="Русский язык"]')!, { target: { value: "для чего" } });
  fireEvent.click(screen.getByText("Сохранить"));
  await waitFor(() => expect(fetchMock).toHaveBeenCalled());
  const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
  expect(url).toBe("/api/cases/possessive");
  expect((JSON.parse(init.body as string) as CaseFile).questions).toEqual([
    { type: "noun", question: { russian: "чего" } },
    { type: "noun", pposition: "for", question: { russian: "для чего" } },
  ]);
});

// ---- Groups, articles, HMR echo ----

type Call = [string, RequestInit];
const reply = (status: number, body: unknown) => Promise.resolve({ ok: status < 400, status, json: () => Promise.resolve(body) });
const okFetch = () => vi.fn().mockImplementation(() => reply(200, { ok: true }));
const body = (fetchMock: ReturnType<typeof vi.fn>, call: number) => JSON.parse((fetchMock.mock.calls[call] as Call)[1].body as string) as Record<string, unknown>;
const callOf = (fetchMock: ReturnType<typeof vi.fn>, call: number) => {
  const [url, init] = fetchMock.mock.calls[call] as Call;
  return `${init.method ?? ""} ${url}`;
};

const caseData = (possessive: object, articles: Record<string, string> = {}) => buildDataFiles({
  "/data/declensions.json": [{ id: "ա", name: { russian: "ա" } }],
  "/data/cases/nominative.json": { id: "nominative", position: 0, name: { russian: "Им" } },
  "/data/cases/possessive.json": { id: "possessive", position: 1, name: { russian: "Род" }, ...possessive },
  "/data/nouns/table.json": { id: "table", cases: [{ case: "nominative", single: { russian: "стол" } }, { case: "possessive", declension: "ա", single: { russian: "стола" } }] },
  "/data/nouns/chair.json": { id: "chair", cases: [{ case: "nominative", single: { russian: "стул" } }, { case: "possessive", single: { russian: "стула" } }] },
  "/data/nouns/cup.json": { id: "cup", cases: [{ case: "nominative", single: { russian: "чашка" } }] },
  ...articles,
});
const page = (files: ReturnType<typeof buildDataFiles>) => <AdminDataContext.Provider value={files}><CasesPage /></AdminDataContext.Provider>;
const FORMS_MD = "---\ntitle: Форма слов\nlanguage: russian\nposition: 0\n---\nтекст\n";
const optionsOf = (group: HTMLElement) => Array.from(within(group).getByRole("listbox", { name: "Слова" }).querySelectorAll("option"), (o) => o.textContent);

describe("groups tab", () => {
  it("offers a custom group only nouns with a form for this case, a declension group only nouns with that declension here, and converts a bare id", async () => {
    const fetchMock = okFetch();
    vi.stubGlobal("fetch", fetchMock);
    render(page(caseData({ declensions: ["ա"] })));
    fireEvent.click(screen.getByText("Род"));
    fireEvent.click(screen.getByRole("tab", { name: "Группы слов" }));
    expect(screen.getByText("автоматически")).toBeInTheDocument();
    fireEvent.click(screen.getAllByText("Добавить группу")[0]!); // no declension chosen: a custom group
    expect(optionsOf(screen.getAllByRole("group", { name: "Группа" })[0]!)).toEqual(["стол", "стул"]);
    fireEvent.click(screen.getAllByText("Добавить группу")[1]!); // the bare "ա" entry's button
    expect(screen.queryByText("автоматически")).not.toBeInTheDocument();
    const declensionGroup = screen.getAllByRole("group", { name: "Группа" })[1]!;
    expect(optionsOf(declensionGroup)).toEqual(["стол"]);
    const select = within(declensionGroup).getByRole<HTMLSelectElement>("listbox", { name: "Слова" });
    select.options[0]!.selected = true;
    fireEvent.change(select);
    fireEvent.click(screen.getByText("Сохранить"));
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(body(fetchMock, 0)).toMatchObject({ groups: [{ words: [] }], declensions: [{ declension: "ա", groups: [{ words: ["table"] }] }] });
  });
});

describe("articles tab", () => {
  const openNewArticle = () => {
    fireEvent.click(screen.getByText("Род"));
    fireEvent.click(screen.getByRole("tab", { name: "Статьи" }));
    fireEvent.click(screen.getByText("Добавить статью"));
    const form = screen.getByRole("group", { name: "Статья" });
    fireEvent.change(within(form).getByLabelText("Идентификатор статьи"), { target: { value: "usage" } });
    fireEvent.change(within(form).getByLabelText("Заголовок"), { target: { value: "  Применение  " } });
    fireEvent.change(within(form).getByLabelText("Текст"), { target: { value: "**жирный**" } });
    return form;
  };

  it("previews Markdown live, saves the article with a trimmed title and then the case listing it", async () => {
    const fetchMock = okFetch();
    vi.stubGlobal("fetch", fetchMock);
    render(page(caseData({ articles: ["forms"] }, { "/data/articles/possessive/forms.md": FORMS_MD })));
    const form = openNewArticle();
    expect(within(form).getByTestId("article-preview").innerHTML).toContain("<strong>жирный</strong>");
    fireEvent.click(within(form).getByText("Сохранить"));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(callOf(fetchMock, 0)).toBe("PUT /api/articles/possessive/usage");
    expect(body(fetchMock, 0)).toEqual({ title: "Применение", language: "russian", position: 1, text: "**жирный**" });
    expect(callOf(fetchMock, 1)).toBe("PUT /api/cases/possessive");
    expect(body(fetchMock, 1).articles).toEqual(["forms", "usage"]);
    expect(screen.getByText("usage (файл отсутствует)")).toBeInTheDocument();
  });

  it("shows the API's 400 for an article that does not round-trip, writes nothing else and keeps the draft", async () => {
    const fetchMock = vi.fn().mockImplementation(() => reply(400, { error: "article frontmatter does not round-trip safely" }));
    vi.stubGlobal("fetch", fetchMock);
    render(page(caseData({})));
    const form = openNewArticle();
    fireEvent.click(within(form).getByText("Сохранить"));
    expect(await within(form).findByText(/article frontmatter does not round-trip safely/)).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(within(form).getByLabelText("Заголовок")).toHaveValue("  Применение  ");
    expect(within(form).getByLabelText("Текст")).toHaveValue("**жирный**");
  });

  it("shows a failed case write after the article was written, and a retry writes both again", async () => {
    let caseFails = true;
    const fetchMock = vi.fn().mockImplementation((url: string) => (url.startsWith("/api/cases/") && caseFails ? reply(400, { error: "boom" }) : reply(200, { ok: true })));
    vi.stubGlobal("fetch", fetchMock);
    render(page(caseData({})));
    const form = openNewArticle();
    fireEvent.click(within(form).getByText("Сохранить"));
    expect(await screen.findByText("Не удалось сохранить: boom")).toBeInTheDocument();
    expect(within(form).getByLabelText("Текст")).toHaveValue("**жирный**");
    caseFails = false;
    fireEvent.click(within(form).getByText("Сохранить"));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(4));
    expect([callOf(fetchMock, 2), callOf(fetchMock, 3)]).toEqual(["PUT /api/articles/possessive/usage", "PUT /api/cases/possessive"]);
    expect(body(fetchMock, 3).articles).toEqual(["usage"]);
  });

  it("deletes by unlisting the article from the case first, then deleting its file", async () => {
    const fetchMock = okFetch();
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(page(caseData({ articles: ["forms"] }, { "/data/articles/possessive/forms.md": FORMS_MD })));
    fireEvent.click(screen.getByText("Род"));
    fireEvent.click(screen.getByRole("tab", { name: "Статьи" }));
    fireEvent.click(screen.getByText("Изменить"));
    const form = screen.getByRole("group", { name: "Статья" });
    expect(within(form).getByLabelText("Заголовок")).toHaveValue("Форма слов");
    fireEvent.click(within(form).getByText("Удалить"));
    await waitFor(() => expect(screen.queryByRole("group", { name: "Статья" })).not.toBeInTheDocument());
    expect([callOf(fetchMock, 0), callOf(fetchMock, 1)]).toEqual(["PUT /api/cases/possessive", "DELETE /api/articles/possessive/forms"]);
    expect(body(fetchMock, 0).articles).toBeUndefined();
  });
});

it("does not report a conflict when HMR echoes the case's own save before the PUT response arrives", async () => {
  let resolve!: (v: unknown) => void;
  vi.stubGlobal("fetch", vi.fn().mockImplementation(() => new Promise((r) => { resolve = r; })));
  const { rerender } = render(page(caseData({})));
  fireEvent.click(screen.getByText("Род"));
  fireEvent.change(screen.getByLabelText("Описание (russian)"), { target: { value: "описание" } });
  fireEvent.click(screen.getByText("Сохранить"));
  rerender(page(caseData({ description: { russian: "описание" } })));
  expect(screen.queryByText(/Падеж изменился на диске/)).not.toBeInTheDocument();
  await act(async () => { resolve({ ok: true, json: () => Promise.resolve({}) }); await Promise.resolve(); });
  expect(screen.getByText("Сохранено")).toBeInTheDocument();
  expect(screen.getByText("Сохранить")).toBeEnabled();
});

// ---- Fix round 1 ----

describe("two-step article save (I1, I2)", () => {
  const pendingFetch = () => {
    const resolvers: ((v: unknown) => void)[] = [];
    const fetchMock = vi.fn().mockImplementation(() => new Promise((r) => { resolvers.push(r); }));
    vi.stubGlobal("fetch", fetchMock);
    return { fetchMock, resolve: (i: number) => act(async () => { resolvers[i]!({ ok: true, json: () => Promise.resolve({}) }); await Promise.resolve(); await Promise.resolve(); }) };
  };
  const caseSaveOutside = (form: HTMLElement) => screen.getAllByText("Сохранить").find((b) => !form.contains(b))!;
  const newArticle = () => {
    fireEvent.click(screen.getByRole("tab", { name: "Статьи" }));
    fireEvent.click(screen.getByText("Добавить статью"));
    const form = screen.getByRole("group", { name: "Статья" });
    fireEvent.change(within(form).getByLabelText("Идентификатор статьи"), { target: { value: "usage" } });
    fireEvent.change(within(form).getByLabelText("Заголовок"), { target: { value: "Применение" } });
    fireEvent.change(within(form).getByLabelText("Текст"), { target: { value: "x" } });
    return form;
  };

  it("keeps the case's own Сохранить disabled through both writes, so no case PUT can overlap", async () => {
    const { fetchMock, resolve } = pendingFetch();
    render(page(caseData({})));
    fireEvent.click(screen.getByText("Род"));
    const form = newArticle();
    fireEvent.click(within(form).getByText("Сохранить"));
    expect(caseSaveOutside(form)).toBeDisabled(); // article PUT in flight
    await resolve(0);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(caseSaveOutside(form)).toBeDisabled(); // case PUT in flight
    await resolve(1);
    expect(caseSaveOutside(form)).toBeEnabled();
  });

  it("builds the case PUT from on-disk changes adopted while the article PUT was in flight", async () => {
    const { fetchMock, resolve } = pendingFetch();
    const { rerender } = render(page(caseData({})));
    fireEvent.click(screen.getByText("Род"));
    const form = newArticle();
    fireEvent.click(within(form).getByText("Сохранить"));
    // No unsaved case edits, so the editor adopts someone else's newer possessive.json.
    rerender(page(caseData({ description: { russian: "чужое" } })));
    await resolve(0);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(body(fetchMock, 1)).toMatchObject({ description: { russian: "чужое" }, articles: ["usage"] });
    await resolve(1);
  });

  it("does not write the case when it goes into conflict mid-flow; the conflict notice shows and the article draft is kept", async () => {
    const { fetchMock, resolve } = pendingFetch();
    const { rerender } = render(page(caseData({})));
    fireEvent.click(screen.getByText("Род"));
    fireEvent.change(screen.getByLabelText("Описание (russian)"), { target: { value: "моё" } }); // unsaved case edit
    const form = newArticle();
    fireEvent.click(within(form).getByText("Сохранить"));
    rerender(page(caseData({ description: { russian: "чужое" } })));
    expect(screen.getByText(/Падеж изменился на диске/)).toBeInTheDocument();
    await resolve(0);
    await act(async () => { await Promise.resolve(); });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(callOf(fetchMock, 0)).toBe("PUT /api/articles/possessive/usage");
    expect(within(form).getByLabelText("Текст")).toHaveValue("x");
  });
});

it("keeps a listed noun that fails the group filter visible and selected, so changing the selection does not drop it (M3)", async () => {
  const fetchMock = okFetch();
  vi.stubGlobal("fetch", fetchMock);
  render(page(caseData({ groups: [{ words: ["cup"] }] })));
  fireEvent.click(screen.getByText("Род"));
  fireEvent.click(screen.getByRole("tab", { name: "Группы слов" }));
  const group = screen.getByRole("group", { name: "Группа" });
  expect(optionsOf(group)).toEqual(["стол", "стул", "(недопустимо) чашка"]);
  const select = within(group).getByRole<HTMLSelectElement>("listbox", { name: "Слова" });
  expect(Array.from(select.selectedOptions, (o) => o.value)).toEqual(["cup"]);
  select.options[0]!.selected = true;
  fireEvent.change(select);
  fireEvent.click(screen.getByText("Сохранить"));
  await waitFor(() => expect(fetchMock).toHaveBeenCalled());
  expect(body(fetchMock, 0).groups).toEqual([{ words: ["table", "cup"] }]);
});
