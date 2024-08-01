"use strict";

export default async function (fastify, opts) {
  fastify.route({
    method: "GET",
    url: "/",
    schema: { hide: true }, // do not display route on openAPI docs
    handler: async function hello(request, reply) {
      const client = await fastify.pg.connect();
      try {
        const { rows } = await client.query("select now() as now");
        return { root: true, rows };
      } finally {
        client.release();
      }
    },
  });
}
