"use client";

import { useId } from "react";
import type { ChangeEvent, InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { SearchIcon } from "./icons";
import { IconButton } from "./button";
import { PlusIcon } from "./icons";
import { cn } from "@/lib/cn";

export type FieldMetaProps = {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
};

function FieldMeta({ id, label, hint, error, required }: FieldMetaProps & { id: string }) {
  return (
    <>
      {label ? <label className="field-label" htmlFor={id}>{label}{required ? <span aria-hidden="true"> *</span> : null}</label> : null}
      {hint && !error ? <span className="field-hint" id={`${id}-hint`}>{hint}</span> : null}
      {error ? <span className="field-error" id={`${id}-error`} role="alert">{error}</span> : null}
    </>
  );
}

export type InputProps = InputHTMLAttributes<HTMLInputElement> & FieldMetaProps;

export function Input({ label, hint, error, required, className, id: providedId, ...props }: InputProps) {
  const generatedId = useId();
  const id = providedId ?? generatedId;
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div className="field">
      <FieldMeta id={id} label={label} hint={hint} error={error} required={required} />
      <input id={id} className={cn("input", error && "input--error", className)} aria-invalid={Boolean(error)} aria-describedby={describedBy} required={required} {...props} />
    </div>
  );
}

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & FieldMetaProps;

export function Textarea({ label, hint, error, required, className, id: providedId, ...props }: TextareaProps) {
  const generatedId = useId();
  const id = providedId ?? generatedId;
  return (
    <div className="field">
      <FieldMeta id={id} label={label} hint={hint} error={error} required={required} />
      <textarea id={id} className={cn("textarea", error && "input--error", className)} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined} required={required} {...props} />
    </div>
  );
}

export type SelectOption = { value: string; label: string; disabled?: boolean };
export type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & FieldMetaProps & { options: SelectOption[] };

export function Select({ label, hint, error, required, options, className, id: providedId, ...props }: SelectProps) {
  const generatedId = useId();
  const id = providedId ?? generatedId;
  return (
    <div className="field">
      <FieldMeta id={id} label={label} hint={hint} error={error} required={required} />
      <select id={id} className={cn("select", error && "input--error", className)} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined} required={required} {...props}>
        {options.map((option) => <option key={option.value} value={option.value} disabled={option.disabled}>{option.label}</option>)}
      </select>
    </div>
  );
}

export function SearchInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={cn("search-input", className)}>
      <SearchIcon size={18} />
      <span className="sr-only">Tìm kiếm</span>
      <input type="search" {...props} />
    </label>
  );
}

export type NumberInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "onChange"> & FieldMetaProps & {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onValueChange: (value: number) => void;
};

export function NumberInput({ value, min, max, step = 1, onValueChange, label, hint, error, required, id: providedId, ...props }: NumberInputProps) {
  const generatedId = useId();
  const id = providedId ?? generatedId;
  const clamp = (next: number) => Math.min(max ?? Number.POSITIVE_INFINITY, Math.max(min ?? Number.NEGATIVE_INFINITY, next));
  return (
    <div className="field">
      <FieldMeta id={id} label={label} hint={hint} error={error} required={required} />
      <div className={cn("number-input", error && "input--error")}>
        <IconButton label="Giảm" size="sm" variant="ghost" onClick={() => onValueChange(clamp(value - step))} disabled={min !== undefined && value <= min}>-</IconButton>
        <input id={id} type="number" value={value} min={min} max={max} step={step} onChange={(event: ChangeEvent<HTMLInputElement>) => onValueChange(clamp(Number(event.currentTarget.value)))} aria-invalid={Boolean(error)} {...props} />
        <IconButton label="Tăng" size="sm" variant="ghost" onClick={() => onValueChange(clamp(value + step))} disabled={max !== undefined && value >= max}><PlusIcon size={16} /></IconButton>
      </div>
    </div>
  );
}
