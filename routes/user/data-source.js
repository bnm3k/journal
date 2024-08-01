"use strict";
import fp from "fastify-plugin";

import { nullLogger } from "../../lib/util.js";

function dataSource(pg, log) {
  return {
    pg: pg,
    log: log || nullLogger,

    async exists(username, log) {
      log = log || this.log;
      const client = await this.pg.connect();
      try {
        const { rows } = await client.query(
          "select 1 from users where username = $1",
          [username]
        );
        return rows.length > 0;
      } finally {
        client.release();
      }
    },

    async getByID(id, log) {
      log = log || this.log;
      const client = await this.pg.connect();
      try {
        const { rows } = await client.query(
          "select id, username from users where id = $1",
          [id]
        );
        if (rows.length == 1) {
          return rows[0];
        } else {
          return null;
        }
      } finally {
        client.release();
      }
    },

    async addNew({ username }, log) {
      log = log || this.log;
      const client = await this.pg.connect();
      try {
        // insert user
        const { rows } = await client.query(
          "insert into users(username) values ($1) returning id",
          [username]
        );
        return rows[0].id; // user ID
      } finally {
        client.release();
      }
    },

    async updateUsername(userID, username, log) {
      log = log || this.log;
      const client = await this.pg.connect();
      try {
        // update username
        await client.query("update users set username=$2 where id=$1", [
          userID,
          username,
        ]);
      } finally {
        client.release();
      }
    },

    async delete(id, log) {
      log = log || this.log;
      // it is assumed that delete cascades to auth and journal entries
      const client = await this.pg.connect();
      try {
        await client.query("delete from users where id = $1", [id]);
      } finally {
        client.release();
      }
    },
  };
}

export default fp(
  async function (fastify, opts) {
    fastify.decorate("user", dataSource(fastify.pg));
  },
  { dependencies: ["db"] }
);
