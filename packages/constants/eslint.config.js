import { config } from "@workspace/eslint-config/base"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...config,
  {
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ["*.config.{js,mjs,cjs,ts}"],
        },
        tsconfigRootDir: __dirname,
      },
    },
  },
]
