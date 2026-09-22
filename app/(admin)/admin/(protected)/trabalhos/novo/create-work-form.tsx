"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import {
  adminWorksQueryKey,
  createWork,
} from "@/lib/api/works.client";
import { getApiErrorMessage } from "@/lib/api/auth.client";
import { revalidateWorksTag } from "@/app/(admin)/admin/actions";
import { Button } from "@/components/ui/button";
import {
  workFormSchema,
  type WorkFormInput,
  type WorkFormOutput,
} from "@/schemas/work";

import { WorkFormFields } from "../work-form-fields";

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
  } = useForm<WorkFormInput, unknown, WorkFormOutput>({
    resolver: zodResolver(workFormSchema),
    defaultValues: {
      slug: "",
      title: "",
      description: "",
      category: "",
      tags: "",
      status: "draft",
    },
  });

  const onSubmit = async (values: WorkFormOutput) => {
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
      <WorkFormFields register={register} errors={errors} />

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
