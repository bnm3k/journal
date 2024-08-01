"use strict";
import fp from "fastify-plugin";

import userDataSource from "./data-source.js";
import authDataSource from "../auth/data-source.js";
import journalDataSource from "../journal/data-source.js";

export const prefixOverride = "";
export default fp(
  async function (fastify, opts) {
    fastify.register(authDataSource);
    fastify.register(userDataSource);
    fastify.register(journalDataSource);
    const tags = ["User"]; // for openAPI docs

    // USER (user, auth)
    // sign up new user
    fastify.route({
      method: "POST",
      url: "/signup",
      schema: {
        tags,
        body: fastify.getSchema("schema:user:signup_new_user"),
        response: {
          201: fastify.getSchema("schema:common:operation_success"),
        },
      },
      handler: async function registerHandler(request, reply) {
        const { username, password } = request.body;
        const alreadyExists = await fastify.user.exists(username);
        if (alreadyExists) {
          const err = new Error("User already registered");
          err.statusCode = 409;
          throw err;
        }

        // add account TODO handle race condition, where other user signs up
        // with same username
        const newUserID = await fastify.user.addNew({ username });
        // add login details
        await fastify.auth.addNewLoginDetails(newUserID, password);

        reply.code(201);
        return { success: true };
      },
    });

    // update username
    fastify.route({
      method: "PUT",
      url: "/username",
      onRequest: fastify.authenticate,
      schema: {
        tags,
        body: fastify.getSchema("schema:user:username_change"),
        response: {
          200: fastify.getSchema("schema:common:operation_success"),
        },
      },
      handler: async function refreshToken(request, reply) {
        const { id } = request.user;
        const { username } = request.body;
        await fastify.user.updateUsername(id, username);
        return { success: true };
      },
    });

    // USER (auth, user)
    // delete user account
    fastify.route({
      method: "DELETE",
      url: "/account",
      onRequest: fastify.authenticate,
      schema: {
        tags,
        response: {
          200: fastify.getSchema("schema:common:operation_success"),
        },
      },
      handler: async function deleteUserDetails(request, reply) {
        const { id } = request.user;
        await fastify.auth.deleteLoginDetails(id);
        await fastify.user.delete(id);
        await fastify.journal.deleteAllEntries(id);
        // TODO revoke token? log out?
        return { success: true };
      },
    });

    // USER (user)
    // get user details
    fastify.route({
      method: "GET",
      url: "/account",
      onRequest: fastify.authenticate,
      schema: {
        tags,
        response: {
          200: fastify.getSchema("schema:user:user_details"),
        },
      },
      handler: async function getUserDetails(request, reply) {
        const { id } = request.user;
        const u = await fastify.user.getByID(id);
        return {
          username: u.username,
          id: u.id,
        };
      },
    });
  },
  {
    name: "user-routes",
    dependencies: ["auth-plugin"],
    encapsulate: true,
  }
);
