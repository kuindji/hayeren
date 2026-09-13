import { createContext } from "react";
import type { DataFiles } from "@/data/schema";
import { useRequired } from "@/shared/hooks/useRequired";

export const AdminDataContext = createContext<DataFiles | null>(null);
AdminDataContext.displayName = "AdminData";
export const useAdminData = (): DataFiles => useRequired(AdminDataContext);
