"use client";

import { useActionState } from "react";
import { loginAction } from "@/app/login/actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, {});

  return (
    <form action={action} className="space-y-3">
      <label className="block text-sm">
        <span className="mb-1 block text-muted">Mot de passe</span>
        <input
          name="password"
          type="password"
          autoFocus
          required
          className="w-full rounded-xl border border-line bg-bg/60 px-3 py-2 text-sm text-fg focus:border-accent/50 focus:outline-none"
        />
      </label>

      {state.error ? <p className="text-sm text-danger">{state.error}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-accent px-4 py-2 text-sm font-medium text-bg transition-colors hover:bg-accent/90 disabled:opacity-60"
      >
        {pending ? "Connexion…" : "Se connecter"}
      </button>
    </form>
  );
}
