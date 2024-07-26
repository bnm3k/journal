"use strict";
import fp from "fastify-plugin";

import authDataSource from "./auth-data-source.js";

export const prefixOverride = "";
export default fp(
  async function (fastify, opts) {
    fastify.register(authDataSource);
    const tags = ["User"]; // for openAPI docs

    // sign up new user
    fastify.route({
      method: "POST",
      url: "/signup",
      schema: {
        tags,
        body: fastify.getSchema("schema:auth:signup_new_user"),
        response: {
          201: fastify.getSchema("schema:auth:operation_success"),
        },
      },
      handler: async function registerHandler(request, reply) {
        const { username, password } = request.body;
        const alreadyExists = await fastify.users.exists(username);
        if (alreadyExists) {
          const err = new Error("User already registered");
          err.statusCode = 409;
          throw err;
        }

        const newUserID = await fastify.users.addNew({ username, password });
        reply.code(201);
        return { success: true };
      },
    });

    // login user & authenticate
    fastify.route({
      method: "POST",
      url: "/login",
      schema: {
        tags,
        body: fastify.getSchema("schema:auth:login_user"),
        response: {
          201: fastify.getSchema("schema:auth:operation_success"),
        },
      },
      handler: async function loginUser(request, reply) {
        const { username, password } = request.body;
        const userID = await fastify.users.authenticate(username, password);
        if (userID === null) {
          const err = new Error("Incorrect details");
          err.statusCode = 401;
          throw err;
        }
        const token = await request.generateToken(userID);
        return { token };
      },
    });

    // delete user account
    fastify.route({
      method: "DELETE",
      url: "/account",
      onRequest: fastify.authenticate,
      schema: {
        tags,
        headers: fastify.getSchema("schema:auth:token_header"),
        response: {
          200: fastify.getSchema("schema:auth:operation_success"),
        },
      },
      handler: async function getUserDetails(request, reply) {
        const { id } = request.user;
        await fastify.users.delete(id);
        return { success: true };
      },
    });

    // get user details
    fastify.route({
      method: "GET",
      url: "/account",
      onRequest: fastify.authenticate,
      schema: {
        tags,
        headers: fastify.getSchema("schema:auth:token_header"),
        response: {
          200: fastify.getSchema("schema:auth:user_details"),
        },
      },
      handler: async function getUserDetails(request, reply) {
        const { id } = request.user;
        const u = await fastify.users.getByID(id);
        return {
          username: u.username,
          id: u.id,
        };
      },
    });

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
          200: fastify.getSchema("schema:auth:operation_success"),
        },
      },
      handler: async function refreshToken(request, reply) {
        const { id } = request.user;
        const user = await fastify.users.getByID(id);
        const { new_password, old_password } = request.body;

        const ok = await fastify.users.changePassword(
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
