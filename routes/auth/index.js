"use strict";
import fp from "fastify-plugin";

import authDataSource from "./data-source.js";

export const prefixOverride = "";
export default fp(
  async function (fastify, opts) {
    fastify.register(authDataSource);
    const tags = ["Auth"]; // for openAPI docs

    // AUTH (auth)
    // login user & authenticate
    fastify.route({
      method: "POST",
      url: "/login",
      schema: {
        tags,
        body: fastify.getSchema("schema:auth:login_user"),
        response: {
          201: fastify.getSchema("schema:common:operation_success"),
        },
      },
      handler: async function loginUser(request, reply) {
        const { username, password } = request.body;
        const userID = await fastify.auth.usernameToID(username);
        if (userID === null) {
          const err = new Error("Incorrect details");
          err.statusCode = 401;
          throw err;
        }
        const ok = await fastify.auth.authenticate(userID, password);
        if (!ok) {
          const err = new Error("Incorrect details");
          err.statusCode = 401;
          throw err;
        }
        const token = await request.generateToken(userID);
        return { token };
      },
    });

    // AUTH
    // refresh
    fastify.route({
      method: "POST",
      url: "/refresh_token",
      onRequest: fastify.authenticate,
      schema: {
        tags,
        headers: fastify.getSchema("schema:auth:token_header"),
        response: {
          200: fastify.getSchema("schema:auth:token"),
        },
      },
      handler: async function refreshToken(request, reply) {
        const { id } = request.user;
        // ensure current token is expired
        request.revokeToken();
        // generate new token
        const token = await request.generateToken(id);
        return { token };
      },
    });

    // AUTH (auth)
    // update password
    fastify.route({
      method: "PUT",
      url: "/password",
      onRequest: fastify.authenticate,
      schema: {
        tags,
        headers: fastify.getSchema("schema:auth:token_header"),
        body: fastify.getSchema("schema:auth:password_change"),
        response: {
          200: fastify.getSchema("schema:common:operation_success"),
        },
      },
      handler: async function refreshToken(request, reply) {
        const { id } = request.user;
        const { new_password, old_password } = request.body;

        const ok = await fastify.auth.changePassword(
          id,
          old_password,
          new_password
        );

        if (!ok) {
          const err = new Error("Incorrect details");
          err.statusCode = 500;
          throw err;
        }
        return { success: true };
      },
    });

    // AUTH
    // logout
    fastify.route({
      method: "POST",
      url: "/logout",
      schema: { tags },
      onRequest: fastify.authenticate,
      handler: async function logoutUser(request, reply) {
        request.revokeToken();
        reply.code(204);
      },
    });
  },
  {
    name: "auth-routes",
    dependencies: ["auth-plugin"],
    encapsulate: true,
  }
);
