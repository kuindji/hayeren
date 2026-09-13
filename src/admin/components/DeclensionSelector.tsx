import { useAdminData } from "@/admin/contexts";

export function DeclensionSelector({ value, onChange }: { value: string | undefined; onChange: (next: string | undefined) => void }) {
  const { declensions } = useAdminData();
  return (
    <select aria-label="Склонение" value={value ?? ""} onChange={(e) => onChange(e.target.value === "" ? undefined : e.target.value)}>
      <option value="" />
      {declensions.map((d) => (
        <option key={d.id} value={d.id}>{d.name.russian ?? d.id}</option>
      ))}
    </select>
  );
}
