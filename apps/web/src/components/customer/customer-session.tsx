"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { CustomerProfile, Wallet } from "@/domain/customer";
import { customerService } from "@/services/customer-service";

type SessionData = { profile: CustomerProfile | null; wallet: Wallet | null; loading: boolean; refresh: () => void };
type SessionState = { profile: CustomerProfile | null; wallet: Wallet | null; settledRevision: number | null };

const CustomerSessionContext = createContext<SessionData | null>(null);

export function CustomerSessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SessionState>({ profile: null, wallet: null, settledRevision: null });
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let active = true;
    customerService.getShellData().then((value) => {
      if (!active) return;
      setSession({ profile: value.profile, wallet: value.wallet, settledRevision: revision });
    });
    return () => { active = false; };
  }, [revision]);

  const value = useMemo(() => ({
    profile: session.profile,
    wallet: session.wallet,
    loading: session.settledRevision !== revision,
    refresh: () => setRevision((current) => current + 1)
  }), [session, revision]);

  return <CustomerSessionContext.Provider value={value}>{children}</CustomerSessionContext.Provider>;
}

export function useCustomerSession() {
  const context = useContext(CustomerSessionContext);
  if (!context) throw new Error("useCustomerSession must be used inside CustomerSessionProvider");
  return context;
}
