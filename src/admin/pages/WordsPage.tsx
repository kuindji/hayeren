import { useEffect, useMemo, useRef, useState } from "react";
import type { Example, Form, Localized, WordCase, WordFile, WordType } from "@/data/schema";
import { compact } from "@/data/json";
import { api } from "@/admin/api";
import { useAdminData } from "@/admin/contexts";
import { ItemsList } from "@/admin/components/ItemsList";
import { CaseTabs } from "@/admin/components/CaseTabs";
import { LocalizedInput } from "@/admin/components/LocalizedInput";
import { FormEditor } from "@/admin/components/FormEditor";
import { ExamplesEditor } from "@/admin/components/ExamplesEditor";
import { DeclensionSelector } from "@/admin/components/DeclensionSelector";

const SAVED_MS = 2000;
const errorText = (e: unknown) => (e instanceof Error ? e.message : String(e));

function compactLocalized<T extends Localized>(l: T | undefined): T | undefined {
  if (!l) return undefined;
  const out = Object.fromEntries(Object.entries(l).filter(([, v]) => v !== undefined && v !== "")) as T;
  return Object.keys(out).length > 0 ? out : undefined;
}

function compactForm<T extends Form>(f: T | undefined): T | undefined {
  if (!f) return undefined;
  // `comment` is taken out first: spreading it raw would let an empty `comment: {}` through, since compact() only drops undefined.
  const { comment, ...rest } = f;
  const out = { ...compactLocalized(rest), ...compact({ comment: compactLocalized(comment) }) } as T;
  return Object.keys(out).length > 0 ? out : undefined;
}

function compactExample(e: Example): Example | undefined {
  const out: Example = { ...compactForm(e), ...compact({ pposition: e.pposition === "" ? undefined : e.pposition }) };
  return Object.keys(out).length > 0 ? out : undefined;
}

function compactCase(c: WordCase): WordCase | undefined {
  const out: WordCase = {
    ...compact({
      ...c,
      declension: c.declension === "" ? undefined : c.declension,
      single: compactForm(c.single),
      plural: compactForm(c.plural),
      comment: compactLocalized(c.comment),
      examples: (c.examples ?? []).map(compactExample).filter((e): e is Example => e !== undefined),
    }),
    case: c.case,
  };
  // A case entry holding nothing but its id would make the site list the word under that case with no forms.
  return Object.keys(out).length > 1 ? out : undefined;
}

/**
 * Removes empty strings, empty objects, empty examples and bare case entries before a save. `compact` drops empty
 * arrays, so the required `cases` array is spread back in afterwards: WordFileSchema rejects a word without it.
 */
// eslint-disable-next-line react-refresh/only-export-components
export function compactWord(w: WordFile): WordFile {
  return {
    ...compact({
      ...w,
      name: compactLocalized(w.name),
      comment: compactLocalized(w.comment),
      description: compactLocalized(w.description),
    }),
    cases: w.cases.map(compactCase).filter((c): c is WordCase => c !== undefined),
  };
}

function setOptional<T extends object, K extends keyof T>(o: T, key: K, value: T[K] | undefined): T {
  const out = { ...o };
  if (value === undefined) delete out[key];
  else out[key] = value;
  return out;
}

function patchCase(word: WordFile, caseId: string, patch: (c: WordCase) => WordCase): WordFile {
  const index = word.cases.findIndex((c) => c.case === caseId);
  if (index === -1) return { ...word, cases: [...word.cases, patch({ case: caseId })] };
  return { ...word, cases: word.cases.map((c, i) => (i === index ? patch(c) : c)) };
}

function WordEditor({ type, word, onDeleted }: { type: WordType; word: WordFile; onDeleted: () => void }) {
  const data = useAdminData();
  const cases = useMemo(() => [...data.cases].sort((a, b) => a.position - b.position), [data.cases]);
  const [draft, setDraft] = useState<WordFile>(word);
  const [tab, setTab] = useState(() => cases[0]?.id ?? "info");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const savedTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(savedTimer.current), []);

  const save = async (next: WordFile) => {
    clearTimeout(savedTimer.current);
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      await api.putWord(type, compactWord(next));
      setSaved(true);
      savedTimer.current = setTimeout(() => setSaved(false), SAVED_MS);
    } catch (e) {
      // The draft is left untouched so the user can fix it and retry.
      setError(`Не удалось сохранить: ${errorText(e)}`);
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!window.confirm("Вы уверены?")) return;
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      await api.deleteWord(type, word.id);
      onDeleted();
    } catch (e) {
      setError(`Не удалось удалить слово: ${errorText(e)}`);
      setSaving(false);
    }
  };

  const status = (
    <>
      {saved && <span className="save-status" role="status">Сохранено</span>}
      {error && <span className="save-error" role="alert">{error}</span>}
    </>
  );
  const saveButton = (
    <div className="word-actions">
      <button type="button" onClick={() => void save(draft)} disabled={saving}>Сохранить</button>
      {status}
    </div>
  );
  const wordCase = draft.cases.find((c) => c.case === tab);

  return (
    <div className="case-word">
      <CaseTabs cases={cases} current={tab} onChange={setTab} withInfo />
      {tab === "info" ? (
        <div className="word-info">
          <LocalizedInput label="Комментарий" value={draft.comment} onChange={(v) => setDraft((d) => setOptional(d, "comment", v))} />
          <LocalizedInput label="Описание" value={draft.description} onChange={(v) => setDraft((d) => setOptional(d, "description", v))} />
          {type === "prepostposition" && (
            <LocalizedInput
              label="Название"
              languages={["armenian", "russian"]}
              value={draft.name}
              onChange={(v) => setDraft((d) => setOptional(d, "name", v))}
            />
          )}
          {saveButton}
          <button type="button" className="danger" onClick={() => void remove()} disabled={saving}>Удалить слово</button>
        </div>
      ) : (
        <div className="word-case">
          <div>
            {type === "noun" && (
              <>
                <h5>Склонение</h5>
                <DeclensionSelector
                  value={wordCase?.declension}
                  onChange={(v) => setDraft((d) => patchCase(d, tab, (c) => setOptional(c, "declension", v)))}
                />
              </>
            )}
            <div className="word-forms">
              <FormEditor
                title={type === "prepostposition" ? undefined : "Единственное число"}
                form={wordCase?.single}
                onChange={(v) => setDraft((d) => patchCase(d, tab, (c) => setOptional(c, "single", v)))}
              />
              {type !== "prepostposition" && (
                <FormEditor
                  title="Множественное число"
                  form={wordCase?.plural}
                  onChange={(v) => setDraft((d) => patchCase(d, tab, (c) => setOptional(c, "plural", v)))}
                />
              )}
            </div>
            {saveButton}
          </div>
          <ExamplesEditor
            key={tab}
            examples={wordCase?.examples}
            showPposition={type !== "prepostposition"}
            onChange={(v) => {
              // Like the old admin, saving an example persists it right away (together with the rest of the draft).
              const next = patchCase(draft, tab, (c) => setOptional(c, "examples", v));
              setDraft(next);
              void save(next);
            }}
          />
        </div>
      )}
    </div>
  );
}

export function WordsPage({ type, title }: { type: WordType; title: string }) {
  const data = useAdminData();
  const words = data.words[type];
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newId, setNewId] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const selected = words.find((w) => w.id === selectedId);

  const add = async () => {
    const id = newId;
    if (id === "") return;
    setAddError(null);
    // The API overwrites an existing file, so an existing id must never reach it as an empty word.
    if (words.some((w) => w.id === id)) {
      setAddError("Слово с таким идентификатором уже существует");
      return;
    }
    setAdding(true);
    try {
      await api.putWord(type, compactWord({ id, cases: [] }));
      setNewId("");
      setSelectedId(id);
    } catch (e) {
      setAddError(`Не удалось добавить слово: ${errorText(e)}`);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="page page-words">
      <div className="page-header">
        <h3>{title}</h3>
        <input
          type="text"
          placeholder="Идентификатор нового слова"
          title="Слово на английском без пробелов маленькими буквами"
          value={newId}
          disabled={adding}
          onChange={(e) => setNewId(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void add();
          }}
        />
        <button type="button" onClick={() => void add()} disabled={adding || newId === ""}>Добавить</button>
        {addError && <span className="save-error" role="alert">{addError}</span>}
      </div>
      <div className="page-2col">
        <div>
          <ItemsList type={type} words={words} selectedId={selectedId} onSelect={setSelectedId} />
        </div>
        <div>
          {selected && <WordEditor key={selected.id} type={type} word={selected} onDeleted={() => setSelectedId(null)} />}
        </div>
      </div>
    </div>
  );
}
