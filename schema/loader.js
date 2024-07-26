import fs from "fs";
import path from "path";

import fp from "fastify-plugin";

import { getFileDir, addAllSchema } from "../app/util.js";

const __dirname = getFileDir(import.meta.url);

function from(filename) {
  const filePath = path.join(__dirname, filename);
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

export default fp(function (fastify, opts, next) {
  fastify.addSchema(from("dotenv.json"));
  addAllSchema(fastify, path.join(__dirname, "common"), "common");
  next();
});
