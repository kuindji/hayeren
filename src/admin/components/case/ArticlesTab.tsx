import { useMemo, useRef, useState, type ReactNode } from "react";
import { marked } from "marked";
import { Slug, type ArticleFrontmatter, type CaseFile } from "@/data/schema";
import { stableStringify } from "@/data/json";
import { api } from "@/admin/api";
import { useAdminData } from "@/admin/contexts";
import { useDraft, type Draft } from "@/admin/hooks/useDraft";
import { DraftStatus } from "@/admin/components/DraftStatus";

type ArticleValue = Omit<ArticleFrontmatter, "position"> & { text: string };

const EMPTY_ARTICLE: ArticleValue = { title: "", language: "russian", text: "" };
const LANGUAGES: [ArticleValue["language"], string][] = [["russian", "Русский"], ["english", "English"]];
// The API refuses a title that does not survive the frontmatter round trip, and leading/trailing spaces do not.
const cleanArticle = (a: ArticleValue): ArticleValue => ({ ...a, title: a.title.trim() });
const sameArticle = (a: ArticleValue, b: ArticleValue) => stableStringify(cleanArticle(a)) === stableStringify(cleanArticle(b));

interface Editing { key: number; slug: string; isNew: boolean }

function ArticleEditor({ caseState, saveCase, editing, onSaved, onDeleted, onClose }: {
  caseState: Draft<CaseFile>;
  saveCase: (next: CaseFile) => Promise<boolean>;
  editing: Editing;
  onSaved: (slug: string) => void;
  onDeleted: () => void;
  onClose: () => void;
}) {
  const data = useAdminData();
  const caseId = caseState.draft.id;
  const [slug, setSlug] = useState(editing.slug);
  const [slugError, setSlugError] = useState<string | null>(null);
  // A new article has no file yet: never pick up an existing file whose slug is being typed.
  const file = editing.isNew ? undefined : data.articles.find((a) => a.case === caseId && a.slug === slug);
  const source = useMemo(() => (file ? { title: file.title, language: file.language, text: file.text } : EMPTY_ARTICLE), [file]);
  const state = useDraft(source, sameArticle);
  const { draft, setDraft } = state;
  const html = useMemo(() => marked.parse(draft.text, { async: false }), [draft.text]);
  const busy = state.saving || caseState.saving;

  const save = async () => {
    if (busy || state.conflict || caseState.conflict) return;
    setSlugError(null);
    if (editing.isNew) {
      if (!Slug.safeParse(slug).success) {
        setSlugError("Идентификатор: латинские буквы в нижнем регистре, цифры и дефисы");
        return;
      }
      // The API overwrites an existing file, so an existing slug must never reach it as a new article.
      if ((caseState.draft.articles ?? []).includes(slug) || data.articles.some((a) => a.case === caseId && a.slug === slug)) {
        setSlugError("Статья с таким идентификатором уже существует");
        return;
      }
    }
    const listed = caseState.draft.articles ?? [];
    const articles = listed.includes(slug) ? listed : [...listed, slug];
    // Article file first, then the case listing it: if the second write fails, the leftover is an unlisted article file,
    // which the validator reports, not a case pointing at a missing file.
    const written = await state.save(draft, (a) => api.putArticle(caseId, slug, { ...cleanArticle(a), position: articles.indexOf(slug) }));
    if (!written) return;
    onSaved(slug);
    if (await saveCase({ ...caseState.draft, articles })) {
      caseState.setDraft((c) => ((c.articles ?? []).includes(slug) ? c : { ...c, articles: [...(c.articles ?? []), slug] }));
    }
  };

  const remove = async () => {
    if (busy || !window.confirm("Вы уверены?")) return;
    // Unlist first, then delete the file: a failed delete leaves an unlisted file the validator reports.
    if (!(await saveCase({ ...caseState.draft, articles: (caseState.draft.articles ?? []).filter((s) => s !== slug) }))) return;
    caseState.setDraft((c) => ({ ...c, articles: (c.articles ?? []).filter((s) => s !== slug) }));
    if (await state.run(() => api.deleteArticle(caseId, slug), "Не удалось удалить статью")) onDeleted();
  };

  return (
    <fieldset aria-label="Статья" className="case-article-form">
      <input
        type="text"
        aria-label="Идентификатор статьи"
        placeholder="Идентификатор статьи"
        title="Латинские буквы в нижнем регистре, цифры и дефисы"
        value={slug}
        disabled={!editing.isNew}
        onChange={(e) => setSlug(e.target.value)}
      />
      {slugError && <span className="save-error" role="alert">{slugError}</span>}
      <input
        type="text"
        aria-label="Заголовок"
        placeholder="Заголовок"
        value={draft.title}
        onChange={(e) => setDraft((a) => ({ ...a, title: e.target.value }))}
      />
      <select
        aria-label="Язык"
        value={draft.language}
        onChange={(e) => {
          const language = LANGUAGES.find(([l]) => l === e.target.value)?.[0];
          if (language) setDraft((a) => ({ ...a, language }));
        }}
      >
        {LANGUAGES.map(([l, label]) => <option key={l} value={l}>{label}</option>)}
      </select>
      <div className="article-editor-2col">
        <textarea aria-label="Текст" placeholder="Текст (Markdown)" value={draft.text} onChange={(e) => setDraft((a) => ({ ...a, text: e.target.value }))} />
        <div className="article-preview" data-testid="article-preview" dangerouslySetInnerHTML={{ __html: html }} />
      </div>
      <div className="word-actions">
        <button type="button" onClick={() => void save()} disabled={busy || state.conflict || caseState.conflict}>Сохранить</button>
        {!editing.isNew && <button type="button" className="danger" onClick={() => void remove()} disabled={busy}>Удалить</button>}
        <button type="button" onClick={onClose} disabled={busy}>Закрыть</button>
        <DraftStatus state={state} conflictMessage="Статья изменилась на диске." reloadLabel="Перезагрузить статью" />
      </div>
    </fieldset>
  );
}

export function ArticlesTab({ state, saveCase, actions }: {
  state: Draft<CaseFile>;
  saveCase: (next: CaseFile) => Promise<boolean>;
  actions: ReactNode;
}) {
  const data = useAdminData();
  const caseId = state.draft.id;
  const slugs = state.draft.articles ?? [];
  const [editing, setEditing] = useState<Editing | null>(null);
  const editorKey = useRef(0);
  const open = (slug: string, isNew: boolean) => setEditing({ key: ++editorKey.current, slug, isNew });
  const move = (index: number, delta: number) =>
    state.setDraft((c) => {
      const list = [...(c.articles ?? [])];
      const a = list[index];
      const b = list[index + delta];
      if (a === undefined || b === undefined) return c;
      list[index] = b;
      list[index + delta] = a;
      return { ...c, articles: list };
    });

  return (
    <div className="case-articles">
      <ol className="case-articles-list">
        {slugs.map((slug, i) => {
          const file = data.articles.find((a) => a.case === caseId && a.slug === slug);
          return (
            <li key={slug}>
              <span>{file ? `${file.title} (${slug})` : `${slug} (файл отсутствует)`}</span>
              <button type="button" aria-label={`Вверх: ${slug}`} onClick={() => move(i, -1)} disabled={i === 0}>↑</button>
              <button type="button" aria-label={`Вниз: ${slug}`} onClick={() => move(i, 1)} disabled={i === slugs.length - 1}>↓</button>
              <button type="button" onClick={() => open(slug, false)}>Изменить</button>
            </li>
          );
        })}
      </ol>
      {actions}
      <button type="button" onClick={() => open("", true)}>Добавить статью</button>
      {editing && (
        <ArticleEditor
          key={editing.key}
          caseState={state}
          saveCase={saveCase}
          editing={editing}
          onSaved={(slug) => setEditing((e) => (e ? { ...e, slug, isNew: false } : e))}
          onDeleted={() => setEditing(null)}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
