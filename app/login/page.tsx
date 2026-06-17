import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { LoginForm } from "@/app/_components/LoginForm";

export const metadata: Metadata = { title: "Connexion" };
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await isAuthenticated()) redirect("/admin");

  return (
    <div className="mx-auto max-w-sm py-12">
      <div className="rounded-2xl border border-line bg-surface p-6">
        <div className="mb-5 flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-accent to-accent-2 text-sm font-bold text-bg">
            DS
          </span>
          <div className="leading-none">
            <p className="font-semibold">Administration</p>
            <p className="text-[11px] text-muted">Deafiaa Serv</p>
          </div>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
