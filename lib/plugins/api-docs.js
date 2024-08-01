import swagger from "@fastify/swagger";
import docsUI from "@scalar/fastify-api-reference";
import fp from "fastify-plugin";

import { version } from "../util.js";

export default fp(
  async function (fastify, opts) {
    const title = "API Reference";
    await fastify.register(swagger, {
      openapi: {
        openapi: "3.0.0",
        info: {
          title: title,
          description: "API Reference",
          version: version,
        },
        components: {
          securitySchemes: null, // no security
        },
      },
    });

    await fastify.register(docsUI, {
      routePrefix: "/docs",
      configuration: {
        exposeRoute: false,
        hideDownloadButton: false,
        searchHotKey: "/",
        metaData: {
          title: title,
        },
      },
    });
  },
  { dependencies: ["application-config"] }
);
