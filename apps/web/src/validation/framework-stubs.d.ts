declare namespace React {
  type ReactNode = unknown;
}

declare namespace JSX {
  type Element = unknown;
  interface ElementChildrenAttribute { children: {}; }
  interface IntrinsicAttributes { key?: string | number; }
  interface IntrinsicElements { [elementName: string]: any; }
}

declare module "react" {
  export type ReactNode = unknown;
  export interface Context<T> { Provider: (props: { value: T; children?: ReactNode }) => JSX.Element; }
  export type SVGProps<T> = { className?: string; children?: ReactNode; [key: string]: any };
  export type HTMLAttributes<T> = { className?: string; children?: ReactNode; [key: string]: any };
  export type ButtonHTMLAttributes<T> = HTMLAttributes<T> & { disabled?: boolean; type?: "button" | "submit" | "reset"; onClick?: (event: MouseEvent<T>) => void };
  export type InputHTMLAttributes<T> = HTMLAttributes<T> & { id?: string; value?: string | number; defaultValue?: string | number; disabled?: boolean; readOnly?: boolean; required?: boolean; placeholder?: string; type?: string; min?: number | string; max?: number | string; step?: number | string; onChange?: (event: ChangeEvent<T>) => void };
  export type TextareaHTMLAttributes<T> = HTMLAttributes<T> & { id?: string; value?: string; defaultValue?: string; disabled?: boolean; readOnly?: boolean; required?: boolean; placeholder?: string; rows?: number; onChange?: (event: ChangeEvent<T>) => void };
  export type SelectHTMLAttributes<T> = HTMLAttributes<T> & { id?: string; value?: string; defaultValue?: string; disabled?: boolean; required?: boolean; onChange?: (event: ChangeEvent<T>) => void };
  export type KeyboardEvent<T> = { key: string; preventDefault(): void; currentTarget: T };
  export type MouseEvent<T> = { target: EventTarget; currentTarget: T; preventDefault(): void };
  export type SyntheticEvent<T> = { target: EventTarget; currentTarget: T; preventDefault(): void };
  export type ChangeEvent<T> = { currentTarget: T; target: T };
  export function useState<T>(initial: T | (() => T)): [T, (value: T | ((current: T) => T)) => void];
  export function useEffect(effect: () => void | (() => void), deps?: readonly unknown[]): void;
  export function useId(): string;
  export function useRef<T>(initial: T): { current: T };
  export function useRef<T>(initial: T | null): { current: T | null };
  export function useCallback<T extends (...args: any[]) => any>(callback: T, deps: readonly unknown[]): T;
  export function useMemo<T>(factory: () => T, deps: readonly unknown[]): T;
  export function createContext<T>(defaultValue: T): Context<T>;
  export function useContext<T>(context: Context<T>): T;
}

declare module "next" {
  export type Metadata = { title?: string; description?: string };
}

declare module "next/link" {
  import type { ReactNode } from "react";
  const Link: (props: { href: string; className?: string; children?: ReactNode; [key: string]: any }) => JSX.Element;
  export default Link;
}

declare module "next/navigation" {
  export function usePathname(): string;
  export function useSearchParams(): { get(name: string): string | null };
  export function useRouter(): { push(path: string): void; replace(path: string): void };
  export function redirect(path: string): never;
}

declare module "*.css";
