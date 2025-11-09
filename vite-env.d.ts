// This file provides type definitions for Vite's `import.meta.env` object.
// By default, it references `vite/client`, but in some CI/CD environments like Vercel,
// this can fail. Manually defining the types provides a more robust solution.

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  // Add other environment variables here if you have them.
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
