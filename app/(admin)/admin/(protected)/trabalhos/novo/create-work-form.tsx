"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import {
  adminWorksQueryKey,
  createWork,
} from "@/lib/api/works.client";
import { getApiErrorMessage } from "@/lib/api/auth.client";
import { revalidateWorksTag } from "@/app/(admin)/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Limites de `title`/`description` refletem as restrições reais já
// validadas pelo backend (`carshop-backend`) — não são valores inventados.
const createWorkSchema = z.object({
  slug: z.string().trim().min(1, "Informe o slug."),
  title: z
    .string()
    .trim()
    .min(1, "Informe o título.")
    .max(120, "O título deve ter no máximo 120 caracteres."),
  description: z
    .string()
    .trim()
    .min(1, "Informe a descrição.")
    .max(5000, "A descrição deve ter no máximo 5000 caracteres."),
  category: z.string().trim().min(1, "Informe a categoria."),
  tags: z
    .string()
    .min(1, "Informe ao menos uma tag.")
    .transform((value) =>
      value
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    )
    .refine((tags) => tags.length > 0, "Informe ao menos uma tag."),
  status: z.enum(["published", "draft"], {
    error: "Selecione o status.",
  }),
});

type CreateWorkFormInput = z.input<typeof createWorkSchema>;
type CreateWorkFormOutput = z.output<typeof createWorkSchema>;

/**
 * Após a mutação Axios, sincroniza de forma independente a query
 * administrativa e o cache público. Falhas nessas invalidações não revertem
 * uma criação já confirmada nem incentivam um segundo POST. A listagem de
 * `/admin` inclui rascunhos e mantém o upload disponível (CARSHOP-33).
 */
export function CreateWorkForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateWorkFormInput, unknown, CreateWorkFormOutput>({
    resolver: zodResolver(createWorkSchema),
    defaultValues: {
      slug: "",
      title: "",
      description: "",
      category: "",
      tags: "",
      status: "draft",
    },
  });

  const onSubmit = async (values: CreateWorkFormOutput) => {
    setSubmitError(null);

    try {
      await createWork(values);
    } catch (error) {
      setSubmitError(getApiErrorMessage(error));
      return;
    }

    await Promise.allSettled([
      queryClient.invalidateQueries({
        queryKey: adminWorksQueryKey,
        refetchType: "none",
      }),
      revalidateWorksTag(),
    ]);

    toast.success("Trabalho criado com sucesso.");
    router.push("/admin");
  };

  return (
    <form
      className="flex flex-col gap-4"
      noValidate
      onSubmit={(event) => void handleSubmit(onSubmit)(event)}
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="work-slug">Slug</Label>
        <Input
          id="work-slug"
          aria-invalid={errors.slug ? "true" : "false"}
          aria-describedby={errors.slug ? "work-slug-error" : undefined}
          {...register("slug")}
        />
        {errors.slug && (
          <p id="work-slug-error" className="text-body-sm text-destructive-text">
            {errors.slug.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="work-title">Título</Label>
        <Input
          id="work-title"
          aria-invalid={errors.title ? "true" : "false"}
          aria-describedby={errors.title ? "work-title-error" : undefined}
          {...register("title")}
        />
        {errors.title && (
          <p
            id="work-title-error"
            className="text-body-sm text-destructive-text"
          >
            {errors.title.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="work-description">Descrição</Label>
        <textarea
          id="work-description"
          aria-invalid={errors.description ? "true" : "false"}
          aria-describedby={
            errors.description ? "work-description-error" : undefined
          }
          className="min-h-24 rounded-lg border border-input bg-transparent px-2.5 py-2 text-body-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          {...register("description")}
        />
        {errors.description && (
          <p
            id="work-description-error"
            className="text-body-sm text-destructive-text"
          >
            {errors.description.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="work-category">Categoria</Label>
        <Input
          id="work-category"
          aria-invalid={errors.category ? "true" : "false"}
          aria-describedby={
            errors.category ? "work-category-error" : undefined
          }
          {...register("category")}
        />
        {errors.category && (
          <p
            id="work-category-error"
            className="text-body-sm text-destructive-text"
          >
            {errors.category.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="work-tags">Tags (separadas por vírgula)</Label>
        <Input
          id="work-tags"
          aria-invalid={errors.tags ? "true" : "false"}
          aria-describedby={errors.tags ? "work-tags-error" : undefined}
          {...register("tags")}
        />
        {errors.tags && (
          <p id="work-tags-error" className="text-body-sm text-destructive-text">
            {errors.tags.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="work-status">Status</Label>
        <select
          id="work-status"
          aria-invalid={errors.status ? "true" : "false"}
          aria-describedby={errors.status ? "work-status-error" : undefined}
          className="min-h-24 rounded-lg border border-input bg-transparent px-2.5 py-2 text-body-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          {...register("status")}
        >
          <option value="draft">Rascunho</option>
          <option value="published">Publicado</option>
        </select>
        {errors.status && (
          <p id="work-status-error" className="text-body-sm text-destructive-text">
            {errors.status.message}
          </p>
        )}
      </div>

      {submitError && (
        <p role="alert" className="text-body-sm text-destructive-text">
          {submitError}
        </p>
      )}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Salvando..." : "Criar trabalho"}
      </Button>
    </form>
  );
}
