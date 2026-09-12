import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { Text } from "@/shared/Text";
import { AppContext, createAppStore } from "@/site/contexts";

const app = createAppStore();
const wrap = (ui: ReactNode) => render(<AppContext.Provider value={app}>{ui}</AppContext.Provider>);

it("renders bold markers and picks the language", () => {
  wrap(<Text t={{ russian: "стол*а*", english: "table" }} />);
  expect(screen.getByText("а").tagName).toBe("B");
  expect(screen.queryByText("table")).toBeNull();
});
it("renders plain strings and empty for undefined", () => {
  const { container } = wrap(<Text t={undefined} />);
  expect(container.textContent).toBe("");
});
