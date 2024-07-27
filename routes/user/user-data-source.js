"use strict";
import fp from "fastify-plugin";

const userDataSource = fp(
  async function (fastify, opts) {
    async function usernameToID(username) {
      const client = await fastify.pg.connect();
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
    }

    async function exists(username) {
      const id = await usernameToID(username);
      return id !== null;
    }

    async function getByID(id) {
      const client = await fastify.pg.connect();
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
    }

    async function addNew({ username }) {
      const client = await fastify.pg.connect();
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
    }

    async function updateUsername(userID, username) {
      const client = await fastify.pg.connect();
      try {
        // update username
        await client.query("update users set username=$2 where id=$1", [
          userID,
          username,
        ]);
      } finally {
        client.release();
      }
    }

    async function delete_(id) {
      // it is assumed that delete cascades to auth and journal entries
      const client = await fastify.pg.connect();
      try {
        await client.query("delete from users where id = $1", [id]);
      } finally {
        client.release();
      }
    }

    fastify.decorate("user", {
      usernameToID: usernameToID,
      updateUsername: updateUsername,
      exists: exists,
      getByID: getByID,
      addNew: addNew,
      delete: delete_,
    });
  },
  { dependencies: ["db"] }
);

export default userDataSource;
