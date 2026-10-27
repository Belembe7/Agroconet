"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { toggleFavoriteAction } from "@/features/catalog/actions";

export function FavoriteToggle({
  slug,
  initialSaved,
}: {
  slug: string;
  initialSaved: boolean;
}) {
  const [saved, setSaved] = useState(initialSaved);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function toggle() {
    setError(null);
    startTransition(async () => {
      try {
        const result = await toggleFavoriteAction(slug);
        if (!result.ok) {
          if (result.loginRequired) {
            toast.info("Entre na sua conta para guardar este produto.");
            router.push(
              `/entrar?next=${encodeURIComponent(`/produtos/${slug}`)}`,
            );
            return;
          }
          setError(result.error);
          return;
        }
        setSaved(result.saved);
        toast.success(
          result.saved
            ? "Produto adicionado aos favoritos."
            : "Produto removido dos favoritos.",
        );
        router.refresh();
      } catch {
        setError("Não foi possível atualizar os favoritos. Tente novamente.");
      }
    });
  }

  return (
    <div className="favorite-toggle-wrap">
      <button
        type="button"
        className="favorite-toggle"
        aria-label={saved ? "Remover dos favoritos" : "Guardar nos favoritos"}
        aria-pressed={saved}
        disabled={pending}
        onClick={toggle}
      >
        <Heart
          aria-hidden="true"
          className={saved ? "size-5 fill-current" : "size-5"}
        />
      </button>
      {error ? (
        <span role="status" className="favorite-toggle-error">
          {error}
        </span>
      ) : null}
    </div>
  );
}
