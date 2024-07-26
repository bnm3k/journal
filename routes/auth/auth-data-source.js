"use strict";
import fp from "fastify-plugin";
import generateHash from "./generate-hash.js";

export const userDataSource = fp(
  async function (fastify, opts) {
    // store users in memory for now
    const users = [];
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

export const authDataSource = fp(
  async function (fastify, opts) {
    // store auth details in memory for now
    const authDetails = [];

    async function addNewLoginDetails(userID, password) {
      const { hash, salt } = await generateHash(password);
      authDetails[userID] = {
        hash,
        salt,
      };
    }

    async function deleteLoginDetails(userID) {
      authDetails[userID] = null;
      return userID;
    }

    // if user authenticate, returns their ID that can be used to generate token
    // in future, move token generation to within this module
    async function authenticate(userID, passwordAttempt) {
      const curr = authDetails[userID];
      const attempt = await generateHash(passwordAttempt, curr.salt);
      // timing attacks? handle?
      if (attempt.hash === curr.hash) {
        return true;
      }
      return false;
    }

    async function changePassword(userID, passwordAttempt, newPassword) {
      const curr = authDetails[userID];
      // check if old password matches what we currently have
      const attempt = await generateHash(passwordAttempt, curr.salt);
      if (attempt.hash !== curr.hash) {
        return false;
      }

      // set new password
      const new_ = await generateHash(newPassword);
      authDetails[userID] = {
        hash: new_.hash,
        salt: new_.salt,
      };
      return true;
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
