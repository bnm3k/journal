"use strict";
import fp from "fastify-plugin";

const journalDataSource = fp(
  async function (fastify, opts) {
    async function addNew(userID, entry) {
      const { title, category, content } = entry;
      const client = await fastify.pg.connect();
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
    }

    async function editEntry(userID, entryID, update) {
      const client = await fastify.pg.connect();
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
    }

    // returns undefined if entry does not exist or user has yet to
    // create a journal entry
    async function getOne(userID, entryID) {
      const client = await fastify.pg.connect();
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
    }

    async function getAll(userID) {
      const client = await fastify.pg.connect();
      try {
        const { rows } = await client.query(
          `select id as "entryID", title, created_at, category, content from journal where user_id = $1`,
          [userID]
        );
        return rows;
      } finally {
        client.release();
      }
    }

    async function deleteEntry(userID, entryID) {
      const client = await fastify.pg.connect();
      try {
        await client.query(
          "delete from journal where user_id = $1 and id = $2",
          [userID, entryID]
        );
      } finally {
        client.release();
      }
    }

    async function deleteAllEntries(userID) {
      const client = await fastify.pg.connect();
      try {
        await client.query("delete from journal where user_id = $1", [userID]);
      } finally {
        client.release();
      }
    }

    fastify.decorate("journal", {
      addNew: addNew,
      editEntry: editEntry,
      getOne: getOne,
      getAll: getAll,
      deleteEntry: deleteEntry,
      deleteAllEntries: deleteAllEntries,
    });
  },
  { dependencies: ["db"] }
);

export default journalDataSource;
