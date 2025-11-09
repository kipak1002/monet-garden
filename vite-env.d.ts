// FIX: Removed `/// <reference types="vite/client" />` as it was causing a "Cannot find type definition file" error.
// The types for import.meta.env are defined manually below to avoid this issue.
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

