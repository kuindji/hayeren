import type { Localized } from "@/data/schema";

export type Language = keyof Localized;

const PLACEHOLDERS: Record<Language, string> = {
  armenian: "Հայերեն",
  informal: "Հայերեն (разговорный)",
  transcription: "Транскрипция",
  russian: "Русский язык",
  english: "English",
};

/** Empty strings delete the key; an object left with no keys becomes `undefined`. Shared with FormEditor. */
// eslint-disable-next-line react-refresh/only-export-components
export function setLocalized(value: Localized | undefined, language: Language, text: string): Localized | undefined {
  const next: Localized = { ...value };
  if (text === "") delete next[language];
  else next[language] = text;
  return Object.keys(next).length > 0 ? next : undefined;
}

export function LocalizedInput({ label, value, onChange, languages = ["russian", "english"] }: {
  label: string;
  value: Localized | undefined;
  onChange: (next: Localized | undefined) => void;
  languages?: Language[];
}) {
  return (
    <section className="localized-input">
      <h5>{label}</h5>
      {languages.map((language) => (
        <input
          key={language}
          type="text"
          placeholder={PLACEHOLDERS[language]}
          aria-label={`${label} (${language})`}
          value={value?.[language] ?? ""}
          onChange={(e) => onChange(setLocalized(value, language, e.target.value))}
        />
      ))}
    </section>
  );
}
