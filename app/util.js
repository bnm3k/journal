import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";

export const version = (() => {
  const __dirname = getFileDir(import.meta.url);
  const projectRoot = path.resolve(__dirname, "..");
  const packageJSONPath = path.join(projectRoot, "package.json");

  return JSON.parse(fs.readFileSync(packageJSONPath)).version;
})();

export function getFileDir(importURL) {
  const __filename = fileURLToPath(importURL);
  const __dirname = path.dirname(__filename);
  return __dirname;
}
