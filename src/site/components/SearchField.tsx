import { useCallback, type ChangeEvent, type InputHTMLAttributes, type ReactNode } from "react";
import { IconClose } from "@/shared/icons";
import { useSwallowEventCallback } from "@/shared/hooks/useSwallowEventCallback";

type SearchFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> & {
  value: string;
  onChange: (value: string) => void;
  before?: ReactNode;
};

export function SearchField({ value, onChange, before, ...pass }: SearchFieldProps) {
  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value), [onChange]);
  const onClear = useSwallowEventCallback(() => onChange(""), [onChange]);
  return (
    <div className="search-field">
      {before}
      <input value={value} onChange={handleChange} {...pass} />
      {value && (
        <a href="#" className="search-field__clear" onClick={onClear}>
          <IconClose />
        </a>
      )}
    </div>
  );
}
