"use strict";
import fp from "fastify-plugin";
import bcrypt from "bcrypt";
import { nullLogger } from "app/util";

function dataSource(pg, log) {
  return {
    pg: pg,
    log: log || nullLogger,
    saltRounds: 10,

    async addNewLoginDetails(userID, password, log) {
      log = log || this.log;
      log.warn({ userID, password }, "addNewLoginDetails");
      const salt = await bcrypt.genSalt(this.saltRounds);
      const hash = await bcrypt.hash(password, salt);
      const client = await this.pg.connect();
      try {
        const text =
          "insert into auth(user_id, hash, salt) values ($1, $2, $3)";
        const values = [userID, hash, salt];
        await client.query(text, values);
      } finally {
        client.release();
      }
    },

    async usernameToID(username, log) {
      log = log || this.log;
      const client = await this.pg.connect();
      try {
        const { rows } = await client.query(
          "select id from users where username = $1",
          [username]
        );
        if (rows.length > 0) {
          return rows[0].id;
        } else {
          return null;
        }
      } finally {
        client.release();
      }
    },

    async deleteLoginDetails(userID, log) {
      log = log || this.log;
      const client = await this.pg.connect();
      try {
        const text = "delete from auth where user_id = $1";
        const values = [userID];
        await client.query(text, values);
      } finally {
        client.release();
      }
      return userID;
    },

    // if user authenticate, returns their ID that can be used to generate token
    // in future, move token generation to within this module
    async authenticate(userID, passwordAttempt, log) {
      log = log || this.log;
      const client = await this.pg.connect();
      try {
        const text = "select hash, salt from auth where user_id = $1";
        const values = [userID];
        const { rows } = await client.query(text, values);
        const curr = rows[0];
        const isMatch = await bcrypt.compare(passwordAttempt, curr.hash);
        return isMatch;
      } finally {
        client.release();
      }
    },

    async changePassword(userID, passwordAttempt, newPassword, log) {
      log = log || this.log;
      const client = await this.pg.connect();
      try {
        const { rows } = await client.query(
          "select hash, salt from auth where user_id = $1",
          [userID]
        );
        const curr = rows[0];
        // check if old password matches what we currently have
        const isMatch = await bcrypt.compare(passwordAttempt, curr.hash);
        if (!isMatch) {
          return false;
        }
        // set new password
        const salt = await bcrypt.genSalt(this.saltRounds);
        const hash = await bcrypt.hash(newPassword, salt);
        await client.query(
          "update auth set hash=$2,salt=$3 where user_id = $1",
          [userID, hash, salt]
        );
        return true;
      } finally {
        client.release();
      }
    },
  };
}

export default fp(
  async function (fastify, opts) {
    fastify.decorate("auth", dataSource(fastify.pg));
  },
  { dependencies: ["db"] }
);
