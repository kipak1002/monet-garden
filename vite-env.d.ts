// FIX: Explicitly define the environment variables to resolve TypeScript errors
// and provide type safety for `import.meta.env`. This ensures that TypeScript
// knows about `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`, fixing the
// "Property 'env' does not exist on type 'ImportMeta'" errors.
// Even if the reference to `vite/client` has issues, this declaration provides the necessary types.
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
