import { config } from '@workspace/eslint-config/base'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default [
  {
    ignores: [
      ".wrangler/**",
      "dist/**",
      "node_modules/**",
      ".turbo/**",
      "worker-configuration.d.ts",
      "src/lib/api",
    ],
  },

  ...config,

  {
    languageOptions: {
        parserOptions: {
          projectService: {
            allowDefaultProject: ["*.mjs", "eslint.config.js"],
          },
          tsconfigRootDir: __dirname,
        },
      },
  },
]
