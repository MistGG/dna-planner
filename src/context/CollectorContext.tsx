import { createContext, useContext, type ReactNode } from "react";
import { useCollector } from "../hooks/useCollector";

type CollectorContextValue = ReturnType<typeof useCollector>;

const CollectorContext = createContext<CollectorContextValue | null>(null);

export function CollectorProvider({ children }: { children: ReactNode }) {
  const value = useCollector();
  return (
    <CollectorContext.Provider value={value}>{children}</CollectorContext.Provider>
  );
}

export function useCollectorContext() {
  const ctx = useContext(CollectorContext);
  if (!ctx) throw new Error("useCollectorContext must be used within CollectorProvider");
  return ctx;
}
