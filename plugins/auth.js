"use strict";

import fp from "fastify-plugin";
import jwt from "@fastify/jwt";

export default fp(
  async function (fastify, opts) {
    const revokedTokens = new Map();

    fastify.register(jwt, {
      secret: fastify.secrets.JWT_SECRET,
      trusted: function isTrusted(request, decodedToken) {
        return !revokedTokens.has(decodedToken.jti);
      },
      sign: {
        expiresIn: fastify.secrets.JWT_EXPIRE_IN,
      },
    });

    fastify.decorate(
      "authenticate",
      async function authenticate(request, reply) {
        try {
          await request.jwtVerify();
        } catch (err) {
          reply.send(err);
        }
      }
    );

    fastify.decorateRequest(
      "generateToken",
      async function generateToken(userID, username) {
        if (userID === undefined || userID === null || !username) {
          throw new Error("userID and/or username empty: ");
        }
        const token = await fastify.jwt.sign(
          { id: String(userID), username },
          {
            jti: String(Date.now()),
            expiresIn: fastify.secrets.JWT_EXPIRE_IN,
          }
        );
        return token;
      }
    );

    fastify.decorateRequest("revokeToken", function () {
      revokedTokens.set(this.user.jti, true);
    });
  },
  { name: "auth-plugin", dependencies: ["application-config"] }
);
