import commonjs from "@rollup/plugin-json/dist/cjs/index.js";
import json from "@rollup/plugin-json";
import resolve from "@rollup/plugin-node-resolve";
import { swc } from "@rollup/plugin-swc";
import typescript from "@rollup/plugin-typescript";
import url from "@rollup/plugin-url";
import { defineConfig } from "rollup";

export default defineConfig({
  input: "src/index.ts",
  output: {
    format: "es",
    file: "dist/index.mjs",
  },
  plugins: [
    url(),
    json(),
    swc(),
    resolve({
      extensions: [".js", ".mjs", ".json", ".node", ".ts", ".tsx"],
      preferBuiltins: true,
    }),
    commonjs(),
    typescript({ sourceMap: false }),
  ],
});
