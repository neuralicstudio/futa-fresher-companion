/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_USE_MOCKS?: string;
}

/** The `version` field of package.json, filled in at build time (vite.config.ts). */
declare const __APP_VERSION__: string;
