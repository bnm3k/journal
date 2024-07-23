import fs from "fs";
import path from "path";

import fp from "fastify-plugin";

import { getFileDir } from "../app/util.js";

function from(filename) {
  const __dirname = getFileDir(import.meta.url);
  const filePath = path.join(__dirname, filename);
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

export default fp(function (fastify, opts, next) {
  fastify.addSchema(from("dotenv.json"));
  next();
});
