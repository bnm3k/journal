import fp from "fastify-plugin";

import { getFileDir, addAllSchema } from "app/util";

export default fp(function (fastify, opts, next) {
  const __dirname = getFileDir(import.meta.url);
  addAllSchema(fastify, __dirname, "user");
  next();
});
