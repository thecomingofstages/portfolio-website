import { readFileSync } from "node:fs";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [
    {
      // Import .yaml as text, as Wrangler's "Text" rule does in the Worker.
      name: "yaml-as-text",
      load(id) {
        if (id.endsWith(".yaml")) return `export default ${JSON.stringify(readFileSync(id, "utf8"))};`;
      },
    },
  ],
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
  },
});
