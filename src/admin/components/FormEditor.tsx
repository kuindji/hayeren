import type { Form } from "@/data/schema";
import { setLocalized, type Language } from "./LocalizedInput";

// Order and placeholders as in the old admin's WordForm.
const FIELDS: { key: Language; comment: boolean; placeholder: string }[] = [
  { key: "armenian", comment: false, placeholder: "Հայերեն" },
  { key: "informal", comment: false, placeholder: "Հայերեն (разговорный)" },
  { key: "transcription", comment: false, placeholder: "Транскрипция" },
  { key: "russian", comment: false, placeholder: "Русский язык" },
  { key: "russian", comment: true, placeholder: "Комментарий" },
  { key: "english", comment: false, placeholder: "English" },
  { key: "english", comment: true, placeholder: "Comment" },
];

function setField(form: Form | undefined, key: Language, comment: boolean, text: string): Form | undefined {
  const next: Form = { ...form };
  if (comment) {
    const c = setLocalized(next.comment, key, text);
    if (c === undefined) delete next.comment;
    else next.comment = c;
  } else if (text === "") {
    delete next[key];
  } else {
    next[key] = text;
  }
  return Object.keys(next).length > 0 ? next : undefined;
}

export function FormEditor({ title, form, onChange }: {
  title?: string | undefined;
  form: Form | undefined;
  onChange: (next: Form | undefined) => void;
}) {
  return (
    <div className="word-form">
      {title && <h5>{title}</h5>}
      {FIELDS.map(({ key, comment, placeholder }) => (
        <input
          key={placeholder}
          type="text"
          placeholder={placeholder}
          value={(comment ? form?.comment?.[key] : form?.[key]) ?? ""}
          onChange={(e) => onChange(setField(form, key, comment, e.target.value))}
        />
      ))}
    </div>
  );
}
