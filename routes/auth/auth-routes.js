"use strict";
import fp from "fastify-plugin";

import generateHash from "./generate-hash.js";

export const prefixOverride = "";
export default fp(
  async function (fastify, opts) {
    // store users in memory for now
    const users = [];
    function getUserByUsername(username) {
      for (let i = 0; i < users.length; i++) {
        let user = users[i];
        if (user.username === username) {
          if (user.deleted == true) {
            return null;
          }
          return user;
        }
      }
      return null;
    }

    function getUserByID(id) {
      if (id >= users.length) {
        return null;
      }
      let user = users[id];
      if (user.deleted == true) {
        return null;
      }
      return user;
    }

    function addNewUser(details) {
      const { username, hash, salt } = details;
      const userID = users.length;
      users[userID] = { id: userID, username, hash, salt, deleted: false };
      return userID;
    }

    // sign up new user
    fastify.route({
      method: "POST",
      url: "/signup",
      schema: {
        body: fastify.getSchema("schema:auth:signup_new_user"),
        response: {
          201: fastify.getSchema("schema:auth:operation_success"),
        },
      },
      handler: async function registerHandler(request, reply) {
        const { username, password } = request.body;
        const existingUser = getUserByUsername(username);
        if (existingUser !== null) {
          const err = new Error("User already registered");
          err.statusCode = 409;
          throw err;
        }

        try {
          const { hash, salt } = await generateHash(password);
          const newUserID = addNewUser({ username, hash, salt });
          request.log.info({ userID: newUserID }, "User registered");
          reply.code(201);
          return { success: true };
        } catch (err) {
          request.log.error(err, "Failed to sign up new user");
          reply.code(500);
          return { success: false };
        }
      },
    });

    // login user & authenticate
    fastify.route({
      method: "POST",
      url: "/login",
      schema: {
        body: fastify.getSchema("schema:auth:login_user"),
        response: {
          201: fastify.getSchema("schema:auth:operation_success"),
        },
      },
      handler: async function loginUser(request, reply) {
        const { username, password } = request.body;
        const user = getUserByUsername(username);
        if (!user) {
          const err = new Error("Incorrect details");
          err.statusCode = 401;
          throw err;
        }

        const { hash } = await generateHash(password, user.salt);
        if (hash !== user.hash) {
          const err = new Error("Incorrect details");
          err.statusCode = 401;
          throw err;
        }

        const token = await request.generateToken(user.id, user.username);
        return { token };
      },
    });

    // delete user account
    fastify.route({
      method: "DELETE",
      url: "/account",
      onRequest: fastify.authenticate,
      schema: {
        headers: fastify.getSchema("schema:auth:token_header"),
        response: {
          200: fastify.getSchema("schema:auth:operation_success"),
        },
      },
      handler: async function getUserDetails(request, reply) {
        const { id } = request.user;
        const user = getUserByID(id);
        user.deleted = true; // soft delete
        // TODO: also delete journal entries
        return { success: true };
      },
    });

    // get user details
    fastify.route({
      method: "GET",
      url: "/account",
      onRequest: fastify.authenticate,
      schema: {
        headers: fastify.getSchema("schema:auth:token_header"),
        response: {
          200: fastify.getSchema("schema:auth:user_details"),
        },
      },
      handler: async function getUserDetails(request, reply) {
        const { id } = request.user;
        const u = getUserByID(id);
        return {
          username: u.username,
          id: u.id,
        };
      },
    });

    // refresh
    fastify.route({
      method: "POST",
      url: "/refresh",
      onRequest: fastify.authenticate,
      schema: {
        headers: fastify.getSchema("schema:auth:token_header"),
        response: {
          200: fastify.getSchema("schema:auth:token"),
        },
      },
      handler: async function refreshToken(request, reply) {
        const { id, username } = request.user;
        // ensure current token is expired
        request.revokeToken();
        // generate new token
        const token = await request.generateToken(id, username);
        return { token };
      },
    });

    // update password
    fastify.route({
      method: "PUT",
      url: "/password",
      onRequest: fastify.authenticate,
      schema: {
        headers: fastify.getSchema("schema:auth:token_header"),
        body: fastify.getSchema("schema:auth:password_change"),
        response: {
          200: fastify.getSchema("schema:auth:operation_success"),
        },
      },
      handler: async function refreshToken(request, reply) {
        const { id } = request.user;
        const { new_password, old_password } = request.body;
        const user = getUserByID(id);
        if (!user) {
          const err = new Error("Incorrect details");
          err.statusCode = 500;
          throw err;
        }

        // check if old password matches what we currently have
        const old = await generateHash(old_password, user.salt);
        if (old.hash !== user.hash) {
          const err = new Error("Incorrect details");
          err.statusCode = 401;
          throw err;
        }

        // set new password
        const new_ = await generateHash(new_password);
        user.hash = new_.hash;
        user.salt = new_.salt;
        return { success: true };
      },
    });

    // logout
    fastify.route({
      method: "POST",
      url: "/logout",
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
