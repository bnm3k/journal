import fs from "fs";
import path from "path";

import fp from "fastify-plugin";

import { getFileDir, addAllSchema } from "../../../app/util.js";

export default fp(function (fastify, opts, next) {
  const __dirname = getFileDir(import.meta.url);
  addAllSchema(fastify, __dirname, "user");
  next();
});
