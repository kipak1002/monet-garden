// FIX: Manually define types for `import.meta.env` to resolve issues where
// TypeScript cannot find the default `vite/client` type declarations. This
// fixes errors related to accessing environment variables and the error
// about the missing type definition file itself.
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  // Add other env variables here for type safety.
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
