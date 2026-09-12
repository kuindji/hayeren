import type { DeclensionView } from "@/model/Case";
import { Declension } from "./Declension";

export function Declensions({ declensions }: { declensions: DeclensionView[] }) {
  if (declensions.length === 0) return null;
  return (
    <div className="full-case__declensions">
      {declensions.map((d) => <Declension key={d.id} declension={d} />)}
    </div>
  );
}
