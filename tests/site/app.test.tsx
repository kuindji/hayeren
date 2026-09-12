import { render, screen } from "@testing-library/react";
import { createMemoryRouter } from "react-router";
import App, { routes } from "@/site/App";

const at = (path: string) => createMemoryRouter(routes, { initialEntries: [path] });

it("renders the header, nav and redirects / to /cases", async () => {
  const router = at("/");
  render(<App router={router} />);
  expect(await screen.findByRole("heading", { level: 1 })).toHaveTextContent("Справочник по армянскому языку");
  expect(screen.getByText("Алфавит")).toBeInTheDocument();
  expect(screen.getByText("Времена глаголов")).toHaveClass("disabled");
  expect(router.state.location.pathname).toBe("/cases");
});

it("renders the alphabet page", async () => {
  render(<App router={at("/alphabet")} />);
  expect(await screen.findByText("Ա")).toBeInTheDocument();
});
