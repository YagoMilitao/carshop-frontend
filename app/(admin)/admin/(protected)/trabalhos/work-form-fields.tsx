import type { FieldErrors, UseFormRegister } from "react-hook-form";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import type { WorkFormInput } from "@/schemas/work";

import { workStatusLabels, workStatusOptions } from "./_components/work-status";

type WorkFormFieldsProps = {
  register: UseFormRegister<WorkFormInput>;
  errors: FieldErrors<WorkFormInput>;
};

/**
 * Campos de apresentação do formulário de `Work`, sem lógica de submit.
 * Compartilhado entre criação (`create-work-form.tsx`) e edição
 * (`edit-work-form.tsx`) para manter os mesmos campos/mensagens de erro.
 */
export function WorkFormFields({ register, errors }: Readonly<WorkFormFieldsProps>) {
  return (
    <>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="work-slug">Identificador da URL</Label>
        <Input
          id="work-slug"
          aria-invalid={errors.slug ? "true" : "false"}
          aria-describedby={
            errors.slug ? "work-slug-error" : "work-slug-hint"
          }
          {...register("slug")}
        />
        {!errors.slug && (
          <p id="work-slug-hint" className="text-body-sm text-muted-foreground">
            Usado na URL pública do trabalho, ex.: /portfolio/restauracao-banco-couro.
          </p>
        )}
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
        <Textarea
          id="work-description"
          aria-invalid={errors.description ? "true" : "false"}
          aria-describedby={
            errors.description ? "work-description-error" : undefined
          }
          className="min-h-24"
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
        {/* `className` do NativeSelect vai para o wrapper (w-fit por padrão). */}
        <NativeSelect
          id="work-status"
          aria-invalid={errors.status ? "true" : "false"}
          aria-describedby={errors.status ? "work-status-error" : undefined}
          className="w-full sm:w-64"
          {...register("status")}
        >
          {workStatusOptions.map((status) => (
            <NativeSelectOption key={status} value={status}>
              {workStatusLabels[status]}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        {errors.status && (
          <p id="work-status-error" className="text-body-sm text-destructive-text">
            {errors.status.message}
          </p>
        )}
      </div>
    </>
  );
}
