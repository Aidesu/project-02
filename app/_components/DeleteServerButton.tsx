"use client";

import { deleteServerAction } from "@/app/admin/actions";

export function DeleteServerButton({
  slug,
  name,
}: {
  slug: string;
  name: string;
}) {
  return (
    <form
      action={deleteServerAction.bind(null, slug)}
      className="inline"
      onSubmit={(e) => {
        if (!confirm(`Supprimer « ${name} » ? Cette action est définitive.`)) {
          e.preventDefault();
        }
      }}
    >
      <button type="submit" className="ml-3 text-danger hover:underline">
        Supprimer
      </button>
    </form>
  );
}
