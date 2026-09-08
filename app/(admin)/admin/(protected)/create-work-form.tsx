"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { createWork } from "@/lib/api/works.client";
import { getApiErrorMessage } from "@/lib/api/auth.client";
import { Button } from "@/components/ui/button";

import { revalidateWorksTag } from "../actions";

/**
 * Mutação client-side (Axios) seguida da Server Action de invalidação de
 * cache (`revalidateWorksTag`), depois `router.refresh()` para re-buscar a
 * listagem no Server Component pai — ordem: mutação -> invalidação ->
 * refresh (nunca invalida antes de confirmar sucesso da mutação).
 */
export function CreateWorkForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await createWork({
        title,
        description,
        category,
        tags: tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        status: "draft",
      });
      await revalidateWorksTag();
      router.refresh();
      setTitle("");
      setDescription("");
      setCategory("");
      setTags("");
    } catch (submitError) {
      setError(getApiErrorMessage(submitError));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(event) => void onSubmit(event)}
    >
      <div className="flex flex-col gap-1.5">
        <label htmlFor="work-title" className="text-sm font-medium">
          Título
        </label>
        <input
          id="work-title"
          required
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="h-9 rounded-lg border border-border bg-background px-2.5 text-sm"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="work-description" className="text-sm font-medium">
          Descrição
        </label>
        <textarea
          id="work-description"
          required
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className="rounded-lg border border-border bg-background px-2.5 py-2 text-sm"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="work-category" className="text-sm font-medium">
          Categoria
        </label>
        <input
          id="work-category"
          required
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          className="h-9 rounded-lg border border-border bg-background px-2.5 text-sm"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="work-tags" className="text-sm font-medium">
          Tags (separadas por vírgula)
        </label>
        <input
          id="work-tags"
          value={tags}
          onChange={(event) => setTags(event.target.value)}
          className="h-9 rounded-lg border border-border bg-background px-2.5 text-sm"
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Salvando..." : "Criar work"}
      </Button>
    </form>
  );
}
