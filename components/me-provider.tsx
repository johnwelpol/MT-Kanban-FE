"use client";

import { createContext, useContext } from "react";
import { can } from "@/lib/permissions";
import type { Me, Permission } from "@/lib/types";

const MeContext = createContext<Me | null>(null);

export function MeProvider({ me, children }: { me: Me; children: React.ReactNode }) {
  return <MeContext.Provider value={me}>{children}</MeContext.Provider>;
}

export function useMe(): Me {
  const me = useContext(MeContext);
  if (!me) throw new Error("useMe must be used inside <MeProvider>");
  return me;
}

export function useCan(permission: Permission): boolean {
  return can(useMe(), permission);
}
