import type { CodegenConfig } from '@graphql-codegen/cli'

// Loaded via tsx (see the "codegen" script). This project is "type": "module",
// so ts-node can't load a .ts config under ESM + moduleResolution: bundler —
// tsx transpiles both this config and the .ts schema loader at runtime instead.
const config: CodegenConfig = {
  overwrite: true,
  ignoreNoDocuments: true,
  schema: {
    'graphql-entrypoint': {
      loader: './resources/ts/graphqlLoader.ts'
    }
  },
  generates: {
    // Schema types only — no documents, so nothing here reaches a browser chunk.
    './resources/ts/graphql/__generated__/types.ts': {
      plugins: ['typescript'],
      config: {
        useTypeImports: true,
        avoidOptionals: true
      }
    },
    // One generated module per api/*.graphql, emitted next to it as *.generated.ts.
    //
    // Not the `client` preset: its `graphql()` helper resolves an operation by
    // looking the source string up in a map that names EVERY operation in the
    // project, so importing the helper anywhere drags all of them in — the preset's
    // own gql.ts says as much ("not tree-shakeable... use the babel or swc plugin").
    // Emitting one document per module isn't just cosmetic either: bundlers
    // tree-shake and chunk at MODULE granularity, so a single generated module
    // holding all 20 documents survives whole as soon as any page uses any one of
    // them. The homepage was preloading every food-menu and store query for nothing.
    './resources/ts/': {
      documents: ['resources/ts/api/*.graphql'],
      preset: 'near-operation-file',
      presetConfig: {
        extension: '.generated.ts',
        baseTypesPath: 'graphql/__generated__/types.ts'
      },
      plugins: ['typescript-operations', 'typed-document-node'],
      config: {
        useTypeImports: true,
        avoidOptionals: true
      }
    }
  }
}

export default config
