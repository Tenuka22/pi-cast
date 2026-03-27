import { defineConfig } from "orval"

const config = {
  serverApiSchemas: {
    input: {
      target: "http://127.0.0.1:8787/api/openapi.json",
    },
    output: {
      target: "./lib/api/schemas",
      client: "zod",
      mode: "split",
      clean: false,
      override: {
        zod: {
          strict: {
            response: false,
            query: false,
            header: false,
            param: false,
            body: true,
          },
        },
      },
    },
  },

  serverApiClient: {
    input: {
      target: "http://127.0.0.1:8787/api/openapi.json",
    },
    output: {
      target: "./lib/api/endpoints.ts",
      client: "react-query",
      mode: "tags-split",
      schemas: "./lib/api/schemas",
      clean: false,
      override: {
        zod: {
          strict: {
            response: false,
            query: false,
            header: false,
            param: false,
            body: true,
          },
        },
        mutator: {
          path: "./lib/orval/fetcher.ts",
          name: "authFetch",
        },
      },
    },
  },
} satisfies Parameters<typeof defineConfig>[0]

export default config
