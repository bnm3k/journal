import fp from "fastify-plugin";
import schema from "./schema/loader.js";

export default fp(
  async function userAutoHooks(fastify, opts) {
    fastify.register(schema);
  },
  {
    encapsulate: true,
  }
);
