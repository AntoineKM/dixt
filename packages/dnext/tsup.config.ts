import { defineConfig, Options } from "tsup";

const config: Options = {
  entry: ["src/index.ts"],
  splitting: false,
  sourcemap: true,
  clean: true,
  platform: "node",
};

export default defineConfig(config);
