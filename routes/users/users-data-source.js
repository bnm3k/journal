"use strict";
import fp from "fastify-plugin";
import generateHash from "./generate-hash.js";

const usersDataSource = fp(
  async function (fastify, opts) {
    // store users in memory for now
    const users = [];
    async function getByUsername(username) {
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

    async function exists(username) {
      for (let i = 0; i < users.length; i++) {
        let user = users[i];
        if (user.username === username) {
          if (user.deleted === true) {
            return false;
          }
          return true;
        }
      }
      return false;
    }

    async function getByID(id) {
      if (id >= users.length) {
        return null;
      }
      let user = users[id];
      if (user.deleted == true) {
        return null;
      }
      return user;
    }

    async function addNew(details) {
      const { username, password } = details;
      const { hash, salt } = await generateHash(password);
      const userID = users.length;
      users[userID] = { id: userID, username, hash, salt, deleted: false };
      return userID;
    }

    // if user authenticate, returns their ID that can be used to generate token
    // in future, move token generation to within this module
    async function authenticate(username, password) {
      const user = await getByUsername(username);
      if (user !== null) {
        const { hash } = await generateHash(password, user.salt);
        // timing attacks? handle?
        if (hash === user.hash) {
          return user.id;
        }
      }
      return null;
    }

    async function changePassword(userID, oldPassword, newPassword) {
      const user = await getByID(userID);
      if (user === null) {
        return false;
      }
      // check if old password matches what we currently have
      const old = await generateHash(oldPassword, user.salt);
      if (old.hash !== user.hash) {
        return false;
      }

      // set new password
      const new_ = await generateHash(newPassword);
      user.hash = new_.hash;
      user.salt = new_.salt;
      return true;
    }

    async function softDelete(id) {
      const user = await getByID(id);
      user.deleted = true; // soft delete
      // TODO: also delete journal entries
    }

    fastify.decorate("users", {
      authenticate: authenticate,
      getByUsername: getByUsername,
      changePassword: changePassword,
      exists: exists,
      getByID: getByID,
      addNew: addNew,
      delete: softDelete,
    });
  },
  { dependencies: ["db"] }
);

export default usersDataSource;
