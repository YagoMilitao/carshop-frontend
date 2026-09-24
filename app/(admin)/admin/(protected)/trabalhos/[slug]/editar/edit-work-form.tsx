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
import { WorkFormFields } from "@/app/(admin)/admin/(protected)/trabalhos/work-form-fields";
import { Button } from "@/components/ui/button";
import {
  AdminEmptyState,
  AdminErrorState,
  AdminLoadingState,
} from "@/app/(admin)/admin/(protected)/_components/admin-states";
import {
  workFormSchema,
  type WorkFormInput,
  type WorkFormOutput,
} from "@/schemas/work";

import { mapWorkToFormValues } from "./work-form-values";

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
    isFetching,
    isPending,
    refetch,
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
    return <AdminLoadingState label="Carregando trabalho..." rows={4} />;
  }

  // Erro antes do loading de refetch: durante o "Tentar novamente" o bloco
  // de erro continua visível com o botão em estado de retry. Com o work já
  // em cache, uma falha de refetch em segundo plano não substitui o form.
  if (error && !work) {
    return (
      <AdminErrorState
        message={getApiErrorMessage(error)}
        onRetry={() => void refetch()}
        isRetrying={isFetching}
      />
    );
  }

  // Cache sem o work (ex.: criado em outra sessão) enquanto refaz o fetch:
  // loading em vez de um "não encontrado" falso.
  if (!work && isFetching) {
    return <AdminLoadingState label="Carregando trabalho..." rows={4} />;
  }

  if (!work) {
    return (
      <AdminEmptyState
        title="Nenhum trabalho encontrado para este identificador."
        action={
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/trabalhos">Voltar para Trabalhos</Link>
          </Button>
        }
      />
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

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button variant="outline" asChild>
          <Link href="/admin/trabalhos">Cancelar</Link>
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : "Salvar"}
        </Button>
      </div>
    </form>
  );
}
