"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { createWork } from "@/lib/api/works.client";
import { getApiErrorMessage } from "@/lib/api/auth.client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
        <Label htmlFor="work-title">Título</Label>
        <Input
          id="work-title"
          required
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="work-description">Descrição</Label>
        <textarea
          id="work-description"
          required
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className="min-h-24 rounded-lg border border-input bg-transparent px-2.5 py-2 text-body-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="work-category">Categoria</Label>
        <Input
          id="work-category"
          required
          value={category}
          onChange={(event) => setCategory(event.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="work-tags">Tags (separadas por vírgula)</Label>
        <Input
          id="work-tags"
          value={tags}
          onChange={(event) => setTags(event.target.value)}
        />
      </div>

      {error && (
        <p role="alert" className="text-body-sm text-destructive-text">
          {error}
        </p>
      )}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Salvando..." : "Criar work"}
      </Button>
    </form>
  );
}
