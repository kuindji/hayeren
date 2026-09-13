import { useAdminData } from "@/admin/contexts";

export function PrepostpositionSelector({ value, onChange }: { value: string | undefined; onChange: (next: string | undefined) => void }) {
  const { words } = useAdminData();
  return (
    <select aria-label="Послелог" value={value ?? ""} onChange={(e) => onChange(e.target.value === "" ? undefined : e.target.value)}>
      <option value="" />
      {words.prepostposition.map((p) => (
        <option key={p.id} value={p.id}>{p.name ? `${p.name.armenian ?? ""} - ${p.name.russian ?? ""}` : p.id}</option>
      ))}
    </select>
  );
}
