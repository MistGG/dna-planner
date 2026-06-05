import { createContext, useContext, type ReactNode } from "react";
import { useSavedGuides } from "../hooks/useSavedGuides";

type SavedGuidesContextValue = ReturnType<typeof useSavedGuides>;

const SavedGuidesContext = createContext<SavedGuidesContextValue | null>(null);

export function SavedGuidesProvider({ children }: { children: ReactNode }) {
  const value = useSavedGuides();
  return (
    <SavedGuidesContext.Provider value={value}>{children}</SavedGuidesContext.Provider>
  );
}

export function useSavedGuidesContext() {
  const ctx = useContext(SavedGuidesContext);
  if (!ctx) {
    throw new Error("useSavedGuidesContext must be used within SavedGuidesProvider");
  }
  return ctx;
}
