// src/global.d.ts
declare module '*.css';

declare module "tailwind-merge" {
  export function twMerge(...classes: any[]): string;
}
