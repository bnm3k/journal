"use strict";

export default async function (fastify, opts) {
  fastify.get("/", async function (request, reply) {
    const client = await fastify.pg.connect();
    try {
      const { rows } = await client.query("select now() as now");
      return { root: true, rows };
    } finally {
      client.release();
    }
  });
}
