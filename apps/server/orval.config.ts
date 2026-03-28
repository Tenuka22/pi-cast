
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const config: any = {
  serverApiSchemas: {
    input: {
      target: "http://127.0.0.1:8787/api/openapi.json",
    },
    output: {
      target: "./lib/api/schemas",
      client: "zod",
      mode: "split",
      clean: true,
      override: {
        zod: {
          strict: {
            response: true,
            query: true,
            header: true,
            param: true,
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
      clean: true,
      override: {
        zod: {
          strict: {
            response: true,
            query: true,
            header: true,
            param: true,
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
}

export default config
