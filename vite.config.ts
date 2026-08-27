/// <reference types="vitest/config" />
import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}"],
    setupFiles: ["src/test/setup.ts"],
    coverage: {
      provider: "v8",
      include: [
        "src/features/public/verification.tsx",
        "src/features/app/api/documents.ts",
        "src/features/app/api/organization.ts",
        "src/features/app/sections/Documents.tsx",
        "src/features/app/sections/Members.tsx",
        "src/features/app/sections/UploadDocuments.tsx",
        "src/features/app/sections/VerificationLogs.tsx",
        "src/features/app/OrgSetup.tsx",
        "src/features/app/hooks/use-create-organization.ts",
        "src/features/auth/components/SignInForm.tsx",
        "src/features/auth/components/SignUpForm.tsx",
        "src/features/auth/components/SignOutButton.tsx",
        "src/features/auth/api/sign-in.ts",
        "src/features/auth/api/sign-up.ts",
        "src/router/AppRouter.tsx",
      ],
    },
  },
})
