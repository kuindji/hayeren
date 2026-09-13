import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { DeclensionsPage } from "@/admin/pages/DeclensionsPage";
import { AdminDataContext } from "@/admin/contexts";
import { buildDataFiles } from "@/data/loader";
import { vi } from "vitest";

const data = buildDataFiles({
  "/data/declensions.json": [{ id: "ա", name: { russian: "ա", armenian: "ա" }, description: { russian: "keep me" } }],
});
const page = () => render(<AdminDataContext.Provider value={data}><DeclensionsPage /></AdminDataContext.Provider>);

afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

it("adds a declension and PUTs the whole list; the saved row's id is no longer editable", async () => {
  const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ ok: true }) });
  vi.stubGlobal("fetch", fetchMock);
  page();
  expect(screen.getAllByLabelText("Идентификатор")[0]).toBeDisabled();
  fireEvent.click(screen.getByText("Добавить"));
  const id = screen.getAllByLabelText("Идентификатор")[1]!;
  fireEvent.change(id, { target: { value: "ի" } });
  fireEvent.change(screen.getAllByLabelText("Название (русский)")[1]!, { target: { value: "и" } });
  fireEvent.change(screen.getAllByLabelText("Комментарий")[1]!, { target: { value: "x" } });
  fireEvent.change(screen.getAllByLabelText("Комментарий")[1]!, { target: { value: "" } });
  expect(id).toBeEnabled();
  fireEvent.click(screen.getByText("Сохранить"));
  await waitFor(() => expect(fetchMock).toHaveBeenCalled());
  const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
  expect(`${init.method ?? ""} ${url}`).toBe("PUT /api/declensions");
  expect(JSON.parse(init.body as string)).toEqual([
    { id: "ա", name: { russian: "ա", armenian: "ա" }, description: { russian: "keep me" } },
    { id: "ի", name: { russian: "и" } },
  ]);
  expect(await screen.findByText("Сохранено")).toBeInTheDocument();
  expect(screen.getAllByLabelText("Идентификатор")[1]).toBeDisabled();
});

it("refuses to save an empty list, with a visible message (decision 4)", () => {
  const fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  page();
  fireEvent.click(screen.getByText("Удалить"));
  expect(screen.getByRole("alert")).toHaveTextContent("Список склонений не может быть пустым");
  expect(screen.getByText("Сохранить")).toBeDisabled();
  fireEvent.click(screen.getByText("Сохранить"));
  expect(fetchMock).not.toHaveBeenCalled();
});

it("shows the API's refusal text when saving would leave dangling references", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
    ok: false,
    status: 409,
    json: () => Promise.resolve({ error: 'write refused, it would introduce reference problems: nouns/table.json: unknown declension "ա"' }),
  }));
  page();
  fireEvent.change(screen.getAllByLabelText("Комментарий")[0]!, { target: { value: "x" } });
  fireEvent.click(screen.getByText("Сохранить"));
  expect(await screen.findByRole("alert")).toHaveTextContent('nouns/table.json: unknown declension "ա"');
  expect(screen.queryByText("Сохранено")).not.toBeInTheDocument();
});
