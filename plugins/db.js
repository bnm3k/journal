"use strict";

import fp from "fastify-plugin";
import pg from "@fastify/postgres";

export default fp(
  async function (fastify, opts) {
    fastify.register(pg, {
      connectionString: fastify.secrets.PG_URL,
    });
  },
  { dependencies: ["application-config"] }
);
