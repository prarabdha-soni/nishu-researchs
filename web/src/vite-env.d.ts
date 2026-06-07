/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the agent API. Empty ⇒ same-origin (dev proxy / prod rewrite). */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
