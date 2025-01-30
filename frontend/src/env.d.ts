/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_BASE_URL: string
  readonly NODE_ENV: 'development' | 'production'
  readonly BUILD_TIME: string
  readonly VERSION: string
  readonly VITE_DEEPSEEK_API_KEY: string
  readonly VITE_ENABLE_AI_SUGGESTIONS: string
  readonly VITE_ENABLE_REAL_TIME_VALIDATION: string
  readonly VITE_ENABLE_ANALYTICS: string
  readonly VITE_ANALYTICS_ID: string
  readonly VITE_CACHE_TTL: string
  readonly VITE_MAX_CACHE_SIZE: string
  readonly VITE_VALIDATION_BATCH_SIZE: string
  readonly VITE_VALIDATION_DEBOUNCE_MS: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
} 