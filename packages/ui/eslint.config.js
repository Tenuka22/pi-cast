import { config } from "@workspace/eslint-config/react-internal"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/** @type {import("eslint").Linter.Config} */
export default [
  { ignores: ["src/"] },
  ...config,
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
  {
    ignores: ["/components/ui"],
  },
]
