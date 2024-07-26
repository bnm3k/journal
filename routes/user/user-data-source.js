"use strict";
import fp from "fastify-plugin";

const users = [];

const userDataSource = fp(
  async function (fastify, opts) {
    // store users in memory for now
    async function usernameToID(username) {
      for (let id = 0; id < users.length; id++) {
        let user = users[id];
        if (user.username === username && user.deleted === false) {
          return id;
        }
      }
      return null;
    }

    async function exists(username) {
      const id = await usernameToID(username);
      return id !== null;
    }

    async function getByID(id) {
      let user = users[id];
      if (user.deleted === true) {
        return null;
      }
      return user;
    }

    async function addNew({ username }) {
      const userID = users.length;
      users[userID] = { id: userID, username, deleted: false };
      return userID;
    }

    async function delete_(id) {
      const user = await getByID(id);
      user.deleted = true; // soft delete
      // TODO: also delete journal entries & auth details
    }

    fastify.decorate("user", {
      usernameToID: usernameToID,
      exists: exists,
      getByID: getByID,
      addNew: addNew,
      delete: delete_,
    });
  },
  { dependencies: ["db"] }
);

export default userDataSource;
