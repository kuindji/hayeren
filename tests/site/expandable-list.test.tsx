import type { ReactNode } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { ExpandableList } from "@/site/components/ExpandableList";
import { AppContext, createAppStore } from "@/site/contexts";

const wrap = (ui: ReactNode) => <AppContext.Provider value={createAppStore()}>{ui}</AppContext.Provider>;

it("shows the first `limit` items, expands on the more link, and renders the header comment", () => {
  const items = ["a", "b", "c", "d", "e", "f", "g"];

  render(wrap(<ExpandableList items={items} keyOf={(s) => s} renderItem={(s) => <div data-testid="row">{s}</div>} title="Список" comment="семь" />));

  expect(screen.getAllByTestId("row")).toHaveLength(5);
  expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent("Список(семь)");
  fireEvent.click(screen.getByRole("link"));
  expect(screen.getAllByTestId("row")).toHaveLength(7);
});

it("renders nothing for an empty list", () => {
  const { container } = render(wrap(<ExpandableList items={[]} keyOf={(s: string) => s} renderItem={(s) => <span>{s}</span>} />));

  expect(container).toBeEmptyDOMElement();
});
