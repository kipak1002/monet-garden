/// <reference types="vite/client" />

// FIX: Manually define types for import.meta.env to resolve TypeScript errors
// when the vite/client types cannot be found. This provides type safety for
// environment variables accessed via `import.meta.env`.
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
