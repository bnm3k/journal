"use strict";
import fp from "fastify-plugin";
import QueryStream from "pg-query-stream";
import JSONStream from "JSONStream";

import { nullLogger } from "app/util";

function dataSource(pg, log) {
  return {
    pg: pg,
    log: log || nullLogger,
    async addNew(userID, entry, log) {
      const { title, category, content } = entry;
      const client = await this.pg.connect();
      try {
        // insert journal entry
        const { rows } = await client.query(
          "insert into journal(user_id, title, category, content) values ($1, $2, $3, $4) returning id",
          [userID, title, category, content]
        );
        return rows[0].id; // entry ID
      } finally {
        client.release();
      }
      return entryID;
    },

    async editEntry(userID, entryID, update, log) {
      log = log || this.log;
      const client = await this.pg.connect();
      try {
        const fields = ["title", "category", "content"];
        for (let i = 0; i < fields.length; i++) {
          let field = fields[i];
          let val = update[field];
          if (val) {
            await client.query(
              `update journal set ${field}=$3 where user_id=$1 and id=$2`,
              [userID, entryID, val]
            );
          }
        }
      } finally {
        client.release();
      }
      return entryID;
    },

    // returns undefined if entry does not exist or user has yet to
    // create a journal entry
    async getOne(userID, entryID, log) {
      log = log || this.log;
      const client = await this.pg.connect();
      try {
        const { rows } = await client.query(
          `select id as "entryID", title, created_at, category, content from journal where user_id = $1 and id = $2`,
          [userID, entryID]
        );
        if (rows.length == 1) {
          return rows[0];
        }
      } finally {
        client.release();
      }
    },

    async getAll(userID, log) {
      log = log || this.log;
      const client = await this.pg.connect();
      const query = new QueryStream(
        `select id as "entryID", title, created_at, category, content from journal where user_id = $1`,
        [userID]
      );
      const stream = client.query(query);
      stream.on("end", () => {
        client.release();
      });
      return stream.pipe(JSONStream.stringify());
    },

    async deleteEntry(userID, entryID, log) {
      log = log || this.log;
      const client = await this.pg.connect();
      try {
        await client.query(
          "delete from journal where user_id = $1 and id = $2",
          [userID, entryID]
        );
      } finally {
        client.release();
      }
    },

    async deleteAllEntries(userID, log) {
      log = log || this.log;
      const client = await this.pg.connect();
      try {
        await client.query("delete from journal where user_id = $1", [userID]);
      } finally {
        client.release();
      }
    },
  };
}

export default fp(
  async function (fastify, opts) {
    fastify.decorate("journal", dataSource(fastify.pg));
  },
  { dependencies: ["db"] }
);
