"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { getApiErrorMessage } from "@/lib/api/auth.client";
import {
  adminWorksQueryKey,
  findAdminWorkBySlug,
  getAdminWorks,
  updateWork,
} from "@/lib/api/works.client";
import { revalidateWorksTag } from "@/app/(admin)/admin/actions";
import { Button } from "@/components/ui/button";

import { WorkFormFields } from "../../work-form-fields";
import {
  mapWorkToFormValues,
  workFormSchema,
  type WorkFormInput,
  type WorkFormOutput,
} from "../../work-form-schema";

type EditWorkFormProps = {
  slug: string;
};

/**
 * Carrega o work pelo `slug` a partir de `getAdminWorks()` (já inclui
 * rascunhos), evitando uma nova chamada HTTP dedicada a busca por slug
 * (que não existe no backend). O submit chama `updateWork(work.id, ...)`
 * — o path param do `PATCH /admin/works/:workId` é o UUID (`work.id`), não
 * o `slug` usado para localizar o work nesta tela.
 */
export function EditWorkForm({ slug }: Readonly<EditWorkFormProps>) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    data: work,
    error,
    isPending,
  } = useQuery({
    queryKey: adminWorksQueryKey,
    queryFn: getAdminWorks,
    select: (works) => findAdminWorkBySlug(works, slug),
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<WorkFormInput, unknown, WorkFormOutput>({
    resolver: zodResolver(workFormSchema),
    values: work ? mapWorkToFormValues(work) : undefined,
  });

  const onSubmit = async (values: WorkFormOutput) => {
    if (!work) {
      return;
    }

    setSubmitError(null);

    try {
      await updateWork(work.id, values);
    } catch (submitCatchError) {
      setSubmitError(getApiErrorMessage(submitCatchError));
      return;
    }

    await Promise.allSettled([
      queryClient.invalidateQueries({
        queryKey: adminWorksQueryKey,
        refetchType: "none",
      }),
      revalidateWorksTag(),
    ]);

    toast.success("Trabalho atualizado com sucesso.");
    router.push("/admin/trabalhos");
  };

  if (isPending) {
    return (
      <output className="text-body-sm text-muted-foreground">
        Carregando trabalho...
      </output>
    );
  }

  if (error) {
    return (
      <p role="alert" className="text-body-sm text-destructive-text">
        {getApiErrorMessage(error)}
      </p>
    );
  }

  if (!work) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-body-sm text-muted-foreground">
          Nenhum trabalho encontrado para este identificador.
        </p>
        <Link
          href="/admin/trabalhos"
          className="text-body-sm text-primary underline underline-offset-4"
        >
          Voltar para Trabalhos
        </Link>
      </div>
    );
  }

  return (
    <form
      className="flex flex-col gap-4"
      noValidate
      onSubmit={(event) => void handleSubmit(onSubmit)(event)}
    >
      <WorkFormFields register={register} errors={errors} />

      {submitError && (
        <p role="alert" className="text-body-sm text-destructive-text">
          {submitError}
        </p>
      )}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Salvando..." : "Salvar"}
      </Button>
    </form>
  );
}
