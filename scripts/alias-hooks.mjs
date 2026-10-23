// Node module-resolution hook so script tests can import app modules that use
// the `@/` alias (tsconfig paths -> src/). Node >=22.18 strips TS types itself.
import { existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const SRC = fileURLToPath(new URL("../src/", import.meta.url));

/** Resolve app aliases to existing source files, delegating other imports to Node. */
export async function resolve(specifier, context, next) {
  if (specifier.startsWith("@/")) {
    const base = join(SRC, specifier.slice(2));
    for (const candidate of [base, `${base}.ts`, `${base}.tsx`, join(base, "index.ts")]) {
      if (existsSync(candidate) && statSync(candidate).isFile()) {
        return next(pathToFileURL(candidate).href, context);
      }
    }
  }
  return next(specifier, context);
}
