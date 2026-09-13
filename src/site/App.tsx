import { useMemo } from "react";
import { createBrowserRouter, RouterProvider, Navigate, Outlet, type RouteObject } from "react-router";
import { createFilter } from "@/model/filter";
import { Database } from "@/model/Database";
import { loadDataFiles } from "@/data/loader";
import { AppContext, DatabaseContext, GlobalFilterContext, createAppStore } from "./contexts";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { ChaptersMenu } from "./components/ChaptersMenu";
import { Alphabet } from "./pages/Alphabet";
import { Cases } from "./pages/Cases";
import "@/styles/index.css";

const database = new Database(loadDataFiles());

function Layout() {
  return (<><Header /><ChaptersMenu /><Outlet /><Footer /></>);
}

// Exported for tests (createMemoryRouter); non-component export only costs Fast Refresh on this file.
// eslint-disable-next-line react-refresh/only-export-components
export const routes: RouteObject[] = [
  { element: <Layout />, children: [
    { path: "/", element: <Navigate to="/cases" replace /> },
    { path: "/cases", element: <Cases /> },
    { path: "/alphabet", element: <Alphabet /> },
  ] },
];

// Created once at module level: a default parameter would call createBrowserRouter on every render of <App />.
let defaultRouter: ReturnType<typeof createBrowserRouter> | undefined;
const getDefaultRouter = () => (defaultRouter ??= createBrowserRouter(routes));

export default function App({ router = getDefaultRouter() }: { router?: ReturnType<typeof createBrowserRouter> }) {
  const app = useMemo(() => createAppStore(), []);
  const globalFilter = useMemo(() => createFilter({ language: "russian" }), []);
  return (
    <AppContext.Provider value={app}>
      <GlobalFilterContext.Provider value={globalFilter}>
        <DatabaseContext.Provider value={database}>
          <RouterProvider router={router} />
        </DatabaseContext.Provider>
      </GlobalFilterContext.Provider>
    </AppContext.Provider>
  );
}
