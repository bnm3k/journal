import fs from "fs";
import path from "path";

import fp from "fastify-plugin";

import { getFileDir } from "../../../app/util.js";

export default fp(function (fastify, opts, next) {
  const __dirname = getFileDir(import.meta.url);
  fs.readdirSync(__dirname).forEach((filename) => {
    if (filename.endsWith(".json")) {
      const filepath = path.join(__dirname, filename);
      const content = fs.readFileSync(filepath, "utf-8");
      const schema = JSON.parse(content);
      const id = path.parse(filename).name;
      schema["$id"] = `schema:auth:${id}`;
      fastify.addSchema(schema);
    }
  });
  next();
});
