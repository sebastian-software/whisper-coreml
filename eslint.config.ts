import { defineConfig, globalIgnores } from "eslint/config"
import eslint from "@eslint/js"
import stylistic from "@stylistic/eslint-plugin"
import tseslint from "typescript-eslint"

export default defineConfig([
  eslint.configs.recommended,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  {
    plugins: {
      "@stylistic": stylistic
    },
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname
      }
    }
  },
  {
    rules: {
      // Require braces for all control statements
      curly: ["error", "all"],

      // Require blank line before block comments, except at start of blocks/interfaces
      // Disabled for now as it conflicts with JSDoc property comments
      "@stylistic/lines-around-comment": "off",

      // Allow console for this CLI-oriented package
      "no-console": "off",

      // Slightly relaxed rules for practical usage
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_"
        }
      ],

      // Require explicit return types for better API documentation
      "@typescript-eslint/explicit-function-return-type": [
        "error",
        {
          allowExpressions: true,
          allowTypedFunctionExpressions: true,
          allowHigherOrderFunctions: true
        }
      ],

      // Enforce consistent type imports
      "@typescript-eslint/consistent-type-imports": [
        "error",
        {
          prefer: "type-imports",
          fixStyle: "inline-type-imports"
        }
      ]
    }
  },
  globalIgnores(["dist/", "build/", "node_modules/", "*.mjs", "*.cjs", "vendor/"])
])
