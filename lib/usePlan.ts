"use client";
// Where her profile and birth plan live:
// - Guest: on this phone only (localStorage). Nothing is uploaded.
// - Signed in (and the database is set up): encrypted on our server, stored in Supabase,
//   so she gets it back whenever she signs in. Nothing is kept on a shared phone.
import { useEffect, useRef, useState } from "react";

export interface Plan {
  name: string; age: string;
  dueDate: string; facility: string; driver: string; driverPhone: string;
  donors: string; familyPhone: string; money: boolean;
}
export const EMPTY_PLAN: Plan = { name: "", age: "", dueDate: "", facility: "", driver: "", driverPhone: "", donors: "", familyPhone: "", money: false };

/** local = on this phone; the rest describe the encrypted copy in the database. */
export type SaveStatus = "local" | "loading" | "saving" | "saved" | "error";

export function usePlan(user: string | null, cloud: boolean) {
  const [plan, setPlan] = useState<Plan>(EMPTY_PLAN);
  const [status, setStatus] = useState<SaveStatus>("local");
  const remote = Boolean(user && cloud);
  const key = `sabicare-plan:${user ?? "guest"}`;
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Load once per person: from the database when signed in, otherwise from this phone.
  useEffect(() => {
    clearTimeout(timer.current);
    if (remote) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStatus("loading");
      fetch("/api/plan")
        .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
        .then((d) => { setPlan({ ...EMPTY_PLAN, ...(d.plan ?? {}) }); setStatus("saved"); })
        .catch(() => setStatus("error"));
      return;
    }
    try {
      const saved = localStorage.getItem(key);
      setPlan(saved ? { ...EMPTY_PLAN, ...JSON.parse(saved) } : EMPTY_PLAN);
    } catch {}
    setStatus("local");
  }, [key, remote]);

  function savePlan(next: Plan) {
    setPlan(next);
    if (!remote) {
      try { localStorage.setItem(key, JSON.stringify(next)); } catch {}
      return;
    }
    // Save a moment after she stops typing, not on every key press.
    setStatus("saving");
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      fetch("/api/plan", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(next) })
        .then((r) => setStatus(r.ok ? "saved" : "error"))
        .catch(() => setStatus("error"));
    }, 700);
  }

  function clearData() {
    clearTimeout(timer.current);
    setPlan(EMPTY_PLAN);
    if (!remote) {
      try { localStorage.removeItem(key); } catch {}
      return;
    }
    fetch("/api/plan", { method: "DELETE" })
      .then((r) => setStatus(r.ok ? "saved" : "error"))
      .catch(() => setStatus("error"));
  }

  return { plan, savePlan, clearData, status, remote };
}
