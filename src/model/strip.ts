export type Language = "russian" | "english";
const accents: Record<Language, Record<string, string>> = {
  russian: { "а́": "а", "é": "е", "и́": "и", "ó": "о", "у́": "у", "ы́": "ы", "э́": "э", "я́": "я", "ю́": "ю" },
  english: { "é": "e", "ú": "u", "í": "i", "ó": "o", "á": "a" },
};
export function strip(text: string | undefined, language: Language): string {
  let t = (text ?? "").toLowerCase().replaceAll("*", "");
  for (const [from, to] of Object.entries(accents[language])) t = t.replaceAll(from, to);
  return t;
}
