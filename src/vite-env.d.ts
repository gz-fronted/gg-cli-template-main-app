/// <reference types="vitest" />
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ENV: string;
  readonly VITE_API_BASE_URL: string;
  readonly VITE_APP_TITLE: string;
  readonly VITE_MICRO_APP_REACT_ENTRY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
