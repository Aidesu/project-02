import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { LoginForm } from "@/app/_components/LoginForm";

export const metadata: Metadata = { title: "Connexion" };

export default function LoginPage() {
  return (
    <div className="shell">
      {/* The session check reads cookies (request-time); keep it out of the
          static shell so the login card renders instantly. */}
      <Suspense fallback={null}>
        <RedirectIfAuthenticated />
      </Suspense>
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

/** Already-signed-in visitors are bounced to the admin dashboard. */
async function RedirectIfAuthenticated() {
  if (await isAuthenticated()) redirect("/admin");
  return null;
}
