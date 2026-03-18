import { nextJsConfig } from "@workspace/eslint-config/next-js"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/** @type {import("eslint").Linter.Config} */
export default [
  ...nextJsConfig,
  {
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ["*.config.{js,mjs,cjs,ts}", "*.mjs"],
        },
        tsconfigRootDir: __dirname,
      },
    },
  },
]
