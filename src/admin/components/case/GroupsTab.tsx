import { useMemo, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import type { CaseDeclension, CaseFile, CaseGroup } from "@/data/schema";
import { setOptional } from "@/admin/compact";
import { useAdminData } from "@/admin/contexts";
import { Word } from "@/model/Word";
import { LocalizedInput } from "@/admin/components/LocalizedInput";
import { DeclensionSelector } from "@/admin/components/DeclensionSelector";

const declensionId = (d: CaseDeclension) => (typeof d === "string" ? d : d.declension);

/** Adds an empty group: to `groups` without a declension, otherwise to that declension's entry (created or converted from a bare id). */
function addGroup(c: CaseFile, declension: string | undefined): CaseFile {
  if (declension === undefined) return { ...c, groups: [...(c.groups ?? []), { words: [] }] };
  const list = c.declensions ?? [];
  const index = list.findIndex((d) => declensionId(d) === declension);
  if (index === -1) return { ...c, declensions: [...list, { declension, groups: [{ words: [] }] }] };
  return {
    ...c,
    declensions: list.map((d, i) =>
      i !== index ? d : typeof d === "string" ? { declension, groups: [{ words: [] }] } : { ...d, groups: [...d.groups, { words: [] }] },
    ),
  };
}

function GroupEditor({ group, nouns, onChange, onRemove }: {
  group: CaseGroup;
  /** The nouns this group may list, as [id, label]. */
  nouns: [string, string][];
  onChange: (next: CaseGroup) => void;
  onRemove: () => void;
}) {
  return (
    <fieldset aria-label="Группа" className="case-group">
      <LocalizedInput label="Название" value={group.name} onChange={(v) => onChange(setOptional(group, "name", v))} />
      <LocalizedInput label="Описание" value={group.description} onChange={(v) => onChange(setOptional(group, "description", v))} />
      <LocalizedInput label="Комментарий" value={group.comment} onChange={(v) => onChange(setOptional(group, "comment", v))} />
      <h5>Слова</h5>
      <select
        multiple
        aria-label="Слова"
        value={group.words}
        onChange={(e) => onChange({ ...group, words: Array.from(e.target.selectedOptions, (o) => o.value) })}
      >
        {nouns.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
      </select>
      <button type="button" className="danger" onClick={onRemove}>Удалить группу</button>
    </fieldset>
  );
}

export function GroupsTab({ value, onChange, actions }: { value: CaseFile; onChange: Dispatch<SetStateAction<CaseFile>>; actions: ReactNode }) {
  const data = useAdminData();
  const caseId = value.id;
  const [newDeclension, setNewDeclension] = useState<string | undefined>(undefined);
  const nouns = useMemo(
    () =>
      data.words.noun
        .map((n) => ({ file: n, label: new Word("noun", n).nominative().russian ?? n.id }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [data.words.noun],
  );
  // The validator rejects (and the site hides or blanks) any other noun: a custom group may only list nouns with an entry
  // for this case, a declension group only nouns whose entry for this case carries that declension.
  const eligible = (declension: string | undefined): [string, string][] =>
    nouns
      .filter(({ file }) => file.cases.some((c) => c.case === caseId && (declension === undefined || c.declension === declension)))
      .map(({ file, label }) => [file.id, label]);
  const declensionName = (id: string) => data.declensions.find((d) => d.id === id)?.name.russian ?? id;

  const setGroups = (update: (groups: CaseGroup[]) => CaseGroup[]) => onChange((c) => ({ ...c, groups: update(c.groups ?? []) }));
  const setDeclensionGroups = (index: number, update: (groups: CaseGroup[]) => CaseGroup[]) =>
    onChange((c) => ({
      ...c,
      declensions: (c.declensions ?? []).map((d, i) => {
        if (i !== index || typeof d === "string") return d;
        const groups = update(d.groups);
        // With its last group gone the entry is the same as a bare id: the declension's words are listed automatically.
        return groups.length > 0 ? { ...d, groups } : d.declension;
      }),
    }));
  const customNouns = eligible(undefined);

  return (
    <div className="case-groups">
      <div className="case-group-add">
        <DeclensionSelector value={newDeclension} onChange={setNewDeclension} />
        <button type="button" onClick={() => onChange((c) => addGroup(c, newDeclension))}>Добавить группу</button>
      </div>
      <section>
        <h4>Группы слов</h4>
        {(value.groups ?? []).map((g, i) => (
          <GroupEditor
            key={i}
            group={g}
            nouns={customNouns}
            onChange={(next) => setGroups((list) => list.map((x, j) => (j === i ? next : x)))}
            onRemove={() => setGroups((list) => list.filter((_, j) => j !== i))}
          />
        ))}
      </section>
      <section>
        <h4>Склонения</h4>
        {(value.declensions ?? []).map((d, i) => (
          <div key={i} className="case-declension">
            <h5>{declensionName(declensionId(d))}</h5>
            {typeof d === "string" ? (
              <p>
                автоматически{" "}
                <button type="button" onClick={() => onChange((c) => addGroup(c, d))}>Добавить группу</button>
              </p>
            ) : (
              d.groups.map((g, j) => (
                <GroupEditor
                  key={j}
                  group={g}
                  nouns={eligible(d.declension)}
                  onChange={(next) => setDeclensionGroups(i, (list) => list.map((x, k) => (k === j ? next : x)))}
                  onRemove={() => setDeclensionGroups(i, (list) => list.filter((_, k) => k !== j))}
                />
              ))
            )}
          </div>
        ))}
      </section>
      {actions}
    </div>
  );
}
