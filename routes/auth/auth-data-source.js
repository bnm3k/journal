"use strict";
import fp from "fastify-plugin";
import generateHash from "./generate-hash.js";

const authDataSource = fp(
  async function (fastify, opts) {
    // store auth details in memory for now

    async function addNewLoginDetails(userID, password) {
      const { hash, salt } = await generateHash(password);
      const client = await fastify.pg.connect();
      try {
        const text =
          "insert into auth(user_id, hash, salt) values ($1, $2, $3)";
        const values = [userID, hash, salt];
        await client.query(text, values);
      } finally {
        client.release();
      }
    }

    async function deleteLoginDetails(userID) {
      const client = await fastify.pg.connect();
      try {
        const text = "delete from auth where user_id = $1";
        const values = [userID];
        await client.query(text, values);
      } finally {
        client.release();
      }
      return userID;
    }

    // if user authenticate, returns their ID that can be used to generate token
    // in future, move token generation to within this module
    async function authenticate(userID, passwordAttempt) {
      const client = await fastify.pg.connect();
      try {
        const text = "select hash, salt from auth where user_id = $1";
        const values = [userID];
        const { rows } = await client.query(text, values);
        const curr = rows[0];
        const attempt = await generateHash(passwordAttempt, curr.salt);
        // timing attacks? handle?
        return attempt.hash === curr.hash;
      } finally {
        client.release();
      }
    }

    async function changePassword(userID, passwordAttempt, newPassword) {
      const client = await fastify.pg.connect();
      try {
        const { rows } = await client.query(
          "select hash, salt from auth where user_id = $1",
          [userID]
        );
        const curr = rows[0];
        // check if old password matches what we currently have
        const attempt = await generateHash(passwordAttempt, curr.salt);
        if (attempt.hash !== curr.hash) {
          // timing attacks? handle?
          return false;
        }
        // set new password
        const new_ = await generateHash(newPassword);
        await client.query(
          "update auth set hash=$2,salt=$3 where user_id = $1",
          [userID, new_.hash, new_.salt]
        );
        return true;
      } finally {
        client.release();
      }
    }

    fastify.decorate("auth", {
      addNewLoginDetails: addNewLoginDetails,
      deleteLoginDetails: deleteLoginDetails,
      authenticate: authenticate,
      changePassword: changePassword,
    });
  },
  { dependencies: ["db"] }
);

export default authDataSource;
