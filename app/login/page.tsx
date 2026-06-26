import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { LoginForm } from "@/app/_components/LoginForm";

export const metadata: Metadata = { title: "Connexion" };
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await isAuthenticated()) redirect("/admin");

  return (
    <div className="shell">
      <div className="mx-auto max-w-sm py-16">
        <div className="rounded-xl border border-line bg-panel p-6">
          <div className="mb-5 flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-md bg-signal text-sm font-bold text-bg">
              DS
            </span>
            <div className="leading-none">
              <p className="font-display font-semibold">Administration</p>
              <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
                DServ
              </p>
            </div>
          </div>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
