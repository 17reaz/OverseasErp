/// <reference types="vite/client" />

declare const __COMMIT_HASH__: string
declare const __APP_VERSION__: string
declare const __BUILD_TIME__: string
declare const __COMMITS__: {
  hash: string
  author: string
  date: string
  subject: string
}[]