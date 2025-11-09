/// <reference types="vite/client" />

// FIX: Manually define types for import.meta.env to address issues with Vite client types not being found.
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
