import { createHashRouter, RouterProvider, Navigate, Outlet } from "react-router";
import { useStoreState } from "@kuindji/reactive/react";
import { WORD_FOLDERS, type WordType } from "@/data/schema";
import { dataStore } from "./data";
import { AdminDataContext } from "./contexts";
import { TopMenu } from "./components/TopMenu";
import { WordsPage } from "./pages/WordsPage";
import { CasesPage } from "./pages/CasesPage";
import { DeclensionsPage } from "./pages/DeclensionsPage";
import { GitStatus } from "./components/GitStatus";
import "@/styles/admin.scss";

const WORD_PAGES: { type: WordType; title: string }[] = [
  { type: "noun", title: "Существительные" },
  { type: "pronoun", title: "Местоимения" },
  { type: "numeral", title: "Числительные" },
  { type: "question", title: "Вопросительные слова" },
  { type: "prepostposition", title: "Пре/послелоги" },
];

function Layout() {
  return (<><header className="admin-header"><TopMenu /><GitStatus /></header><Outlet /></>);
}

const router = createHashRouter([
  { element: <Layout />, children: [
    { path: "/", element: <Navigate to="/nouns" replace /> },
    ...WORD_PAGES.map(({ type, title }) => ({ path: `/${WORD_FOLDERS[type]}`, element: <WordsPage key={type} type={type} title={title} /> })),
    { path: "/cases", element: <CasesPage /> },
    { path: "/declensions", element: <DeclensionsPage /> },
  ] },
]);

export default function App() {
  // Re-renders every page when data.ts's HMR accept callback bumps the store after a save.
  const files = useStoreState(dataStore, "files")[0];
  return (
    <AdminDataContext.Provider value={files}>
      <RouterProvider router={router} />
    </AdminDataContext.Provider>
  );
}
