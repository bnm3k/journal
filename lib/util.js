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

export function addAllSchema(fastify, dirPath, mod) {
  fs.readdirSync(dirPath).forEach((filename) => {
    if (filename.endsWith(".json")) {
      const filepath = path.join(dirPath, filename);
      const content = fs.readFileSync(filepath, "utf-8");
      const schema = JSON.parse(content);
      const id = path.parse(filename).name;
      schema["$id"] = `schema:${mod}:${id}`;
      fastify.addSchema(schema);
    }
  });
}

import os from "os";
import pino from "pino";
export const nullLogger = pino(pino.destination(os.devNull));
