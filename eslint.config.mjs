import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Nested build output from agent worktrees (e.g. .claude/worktrees/*/.next)
    // isn't covered by the ".next/**" pattern above since it only matches
    // at the repo root.
    "**/.next/**",
    ".claude/worktrees/**",
  ]),
]);

export default eslintConfig;
