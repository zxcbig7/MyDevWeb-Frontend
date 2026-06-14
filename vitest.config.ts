import { defineConfig } from "vitest/config";

// 純函式單測（apfEval / depGraph）跑 node 環境，不需 react / tailwind plugin。
// 與 app build（tsc -b）解耦：test 檔已在 tsconfig.app.json exclude。
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
  },
});
