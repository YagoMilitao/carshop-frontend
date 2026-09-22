"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { getApiErrorMessage } from "@/lib/api/auth.client";
import {
  adminWorksQueryKey,
  findAdminWorkBySlug,
  getAdminWorks,
} from "@/lib/api/works.client";
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
 * (que não existe no backend). O submit real (`updateWork`) está
 * bloqueado pela CARSHOP-135 — ver `lib/api/works.client.ts` — por isso o
 * botão "Salvar" nasce desabilitado, mesmo com formulário/validação/
 * carregamento totalmente funcionais.
 */
export function EditWorkForm({ slug }: Readonly<EditWorkFormProps>) {
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
    formState: { errors },
  } = useForm<WorkFormInput, unknown, WorkFormOutput>({
    resolver: zodResolver(workFormSchema),
    values: work ? mapWorkToFormValues(work) : undefined,
  });

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
    <form className="flex flex-col gap-4" noValidate>
      <WorkFormFields register={register} errors={errors} />

      <Button
        type="submit"
        disabled
        aria-disabled="true"
        title="Disponível em breve"
      >
        Salvar
      </Button>
    </form>
  );
}
