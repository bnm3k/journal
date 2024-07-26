"use strict";
import fp from "fastify-plugin";
import generateHash from "./generate-hash.js";

const authDetails = [];

const authDataSource = fp(
  async function (fastify, opts) {
    // store auth details in memory for now

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

export default authDataSource;
