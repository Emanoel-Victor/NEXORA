/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_PERFECT_PAY_PRO_CHECKOUT_URL: string
  readonly VITE_PERFECT_PAY_PREMIUM_CHECKOUT_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
