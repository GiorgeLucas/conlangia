import React, { createContext, useContext, useState } from "react";

export type NavPage = "lexicon" | "morphology" | "categories" | "settings";

interface NavigationContextValue {
  currentPage: NavPage;
  setCurrentPage: (page: NavPage) => void;
}

const NavigationContext = createContext<NavigationContextValue | null>(null);

export function NavigationProvider({
  initialPage = "lexicon",
  children,
}: {
  initialPage?: NavPage;
  children: React.ReactNode;
}) {
  const [currentPage, setCurrentPage] = useState<NavPage>(initialPage);

  return (
    <NavigationContext.Provider value={{ currentPage, setCurrentPage }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const ctx = useContext(NavigationContext);
  if (!ctx) {
    throw new Error("useNavigation must be used within a NavigationProvider");
  }
  return ctx;
}
