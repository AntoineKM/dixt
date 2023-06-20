import { defineConfig, Options } from "tsup";

const config: Options = {
  entry: ["src/**/*.ts", "src/**/*.js"],
  splitting: true,
  sourcemap: true,
  clean: true,
  platform: "node",
  dts: true,
  minify: true,
};

export default defineConfig(config);
