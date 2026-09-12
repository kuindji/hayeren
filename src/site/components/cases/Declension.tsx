import type { DeclensionView } from "@/model/Case";
import { Text } from "@/shared/Text";
import { useLanguage } from "../../hooks";
import { Words } from "../Words";

export function Declension({ declension }: { declension: DeclensionView }) {
  const language = useLanguage();
  return (
    <div className="full-case__declension">
      <h3>
        <Text t={declension.name} />
        {declension.comment?.[language] && <span className="comment">(<Text t={declension.comment} />)</span>}
      </h3>
      {declension.groups.map((g, inx) => <Words key={inx} words={g.words} title={g.name} Header="h4" />)}
    </div>
  );
}
