/// <reference types="vite/client" />

// Fix: Explicitly define ImportMetaEnv to solve issues with vite/client types not being found.
// This provides type safety for environment variables accessed via `import.meta.env`.
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
