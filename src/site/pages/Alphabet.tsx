import alphabet, { type Letter as LetterData } from "@/model/alphabet";

function Letter({ letter, index }: { letter: LetterData; index: number }) {
  return (
    <div className="alphabet-letter">
      <div className="index">{index}</div>
      <div className="armenian">
        <span>{letter.armenian.upper}</span>
        <span>{letter.armenian.lower}</span>
      </div>
      <div className="russian">
        <span>{letter.russian}</span>
      </div>
    </div>
  );
}

export function Alphabet() {
  return (
    <div className="alphabet">
      {alphabet.map((l, i) => <Letter key={l.armenian.lower} letter={l} index={i + 1} />)}
    </div>
  );
}
