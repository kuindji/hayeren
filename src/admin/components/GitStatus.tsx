import { useEffect, useState } from "react";
import { api, errorText } from "@/admin/api";

const POLL_MS = 5000;

type Result<T> = { ok: true; value: T } | { ok: false; error: string };

function plural(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

/** Polls git status and the validator. Nothing is rendered only when git is known to be clean and there are no problems. */
export function GitStatus() {
  const [git, setGit] = useState<Result<string[]> | null>(null);
  const [problems, setProblems] = useState<Result<string[]> | null>(null);

  useEffect(() => {
    let active = true;
    const poll = () => {
      api.gitStatus().then(
        (r) => { if (active) setGit({ ok: true, value: r.files }); },
        (e: unknown) => { if (active) setGit({ ok: false, error: errorText(e) }); },
      );
      api.validate().then(
        (r) => { if (active) setProblems({ ok: true, value: r.problems }); },
        (e: unknown) => { if (active) setProblems({ ok: false, error: errorText(e) }); },
      );
    };
    poll();
    // Errors do not stop polling: the next tick may succeed.
    const timer = setInterval(poll, POLL_MS);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  return (
    <div className="git-status">
      {git && !git.ok && <span className="save-error" role="alert">Статус git недоступен: {git.error}</span>}
      {git?.ok && git.value.length > 0 && (
        <span className="git-status-files" title={git.value.join("\n")}>
          Изменения не сохранены в git: {git.value.length} {plural(git.value.length, "файл", "файла", "файлов")}
        </span>
      )}
      {problems && !problems.ok && <span className="save-error" role="alert">Проверка данных недоступна: {problems.error}</span>}
      {problems?.ok && problems.value.length > 0 && (
        <ul className="validate-problems" aria-label="Проблемы в данных">
          {problems.value.map((p) => <li key={p}>{p}</li>)}
        </ul>
      )}
    </div>
  );
}
