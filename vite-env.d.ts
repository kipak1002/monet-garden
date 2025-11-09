/// <reference types="vite/client" />

// FIX: Add explicit type definitions for environment variables to resolve
// errors related to `import.meta.env` and the "Cannot find type definition file for 'vite/client'" error.
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
