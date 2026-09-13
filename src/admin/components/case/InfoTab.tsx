import type { Dispatch, ReactNode, SetStateAction } from "react";
import type { CaseFile } from "@/data/schema";
import { setOptional } from "@/admin/compact";
import { LocalizedInput } from "@/admin/components/LocalizedInput";

export function InfoTab({ value, onChange, actions }: { value: CaseFile; onChange: Dispatch<SetStateAction<CaseFile>>; actions: ReactNode }) {
  return (
    <div className="word-info">
      <LocalizedInput label="Название" value={value.name} onChange={(v) => onChange((c) => ({ ...c, name: v ?? {} }))} />
      <LocalizedInput label="Описание" value={value.description} onChange={(v) => onChange((c) => setOptional(c, "description", v))} />
      <section>
        <h5>Позиция</h5>
        <input
          type="number"
          min={0}
          step={1}
          aria-label="Позиция"
          value={value.position}
          onChange={(e) => {
            const n = e.target.valueAsNumber;
            // CaseFileSchema requires a non-negative integer; anything else (e.g. a cleared field) is not applied.
            if (Number.isInteger(n) && n >= 0) onChange((c) => ({ ...c, position: n }));
          }}
        />
      </section>
      {actions}
    </div>
  );
}
