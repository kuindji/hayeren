import { render, screen, act } from "@testing-library/react";
import { GitStatus } from "@/admin/components/GitStatus";
import { vi } from "vitest";

const reply = (status: number, body: unknown) => Promise.resolve({ ok: status < 400, status, json: () => Promise.resolve(body) });
const flush = (ms = 0) => act(async () => { await vi.advanceTimersByTimeAsync(ms); });

beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

it("shows an explicit error when git status fails, keeps polling every 5 s, and stops polling on unmount", async () => {
  let gitFails = true;
  const fetchMock = vi.fn().mockImplementation((url: string) => {
    if (url === "/api/git-status") {
      return gitFails ? reply(500, { error: "git status failed: boom" }) : reply(200, { clean: false, files: ["data/cases/possessive.json", "data/declensions.json"] });
    }
    return reply(200, { problems: [] });
  });
  vi.stubGlobal("fetch", fetchMock);
  const { unmount } = render(<GitStatus />);
  await flush();
  expect(screen.getByRole("alert")).toHaveTextContent("Статус git недоступен: git status failed: boom");
  gitFails = false;
  await flush(5000);
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  expect(screen.getByText("Изменения не сохранены в git: 2 файла")).toHaveAttribute("title", "data/cases/possessive.json\ndata/declensions.json");
  const calls = fetchMock.mock.calls.length;
  expect(calls).toBe(4);
  unmount();
  await vi.advanceTimersByTimeAsync(15000);
  expect(fetchMock).toHaveBeenCalledTimes(calls);
});

it("renders nothing when git is clean and there are no problems", async () => {
  vi.stubGlobal("fetch", vi.fn().mockImplementation((url: string) => (url === "/api/git-status" ? reply(200, { clean: true, files: [] }) : reply(200, { problems: [] }))));
  const { container, unmount } = render(<GitStatus />);
  await flush();
  expect(container.textContent).toBe("");
  unmount();
});

it("lists validator problems, and shows an explicit error when validation itself fails", async () => {
  let validateFails = false;
  vi.stubGlobal("fetch", vi.fn().mockImplementation((url: string) => {
    if (url === "/api/git-status") return reply(200, { clean: true, files: [] });
    return validateFails ? reply(500, { error: "crashed" }) : reply(200, { problems: ["articles/cases/possessive/usage.md: not listed in cases/possessive.json articles"] });
  }));
  const { unmount } = render(<GitStatus />);
  await flush();
  expect(screen.getByRole("list", { name: "Проблемы в данных" })).toHaveTextContent("articles/cases/possessive/usage.md: not listed");
  validateFails = true;
  await flush(5000);
  expect(screen.getByRole("alert")).toHaveTextContent("Проверка данных недоступна: crashed");
  unmount();
});
