// Fix: Manually define types for `import.meta.env` to resolve an issue where
// the `vite/client` type definitions could not be found. This provides the
// necessary types for the environment variables used in the application.
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
