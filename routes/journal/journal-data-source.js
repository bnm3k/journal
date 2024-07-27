"use strict";
import fp from "fastify-plugin";

// store entries in memory for now
const allEntries = [];

const journalDataSource = fp(
  async function (fastify, opts) {
    async function addNew(userID, entry) {
      const { title, content, category } = entry;
      if (allEntries[userID] === undefined) {
        allEntries[userID] = [];
      }
      const entries = allEntries[userID];
      const entryID = entries.length;
      entries[entryID] = {
        title,
        category,
        createdAt: Date.now(),
        content,
      };
      return entryID;
    }

    async function editEntry(userID, entryID, update) {
      const entry = await getOne(userID, entryID);
      if (!entry) {
        return;
      }
      const fields = ["title", "category", "content"];
      fields.forEach((k) => {
        const v = update[k];
        if (v) {
          entry[k] = v;
        }
      });
    }

    // returns undefined if entry does not exist or user has yet to
    // create a journal entry
    async function getOne(userID, entryID) {
      const entries = allEntries[userID];
      if (entries !== undefined) {
        return entries[entryID];
      }
    }

    async function getAll(userID) {
      const entries = allEntries[userID];
      if (entries === undefined) {
        return [];
      }
      return entries.filter((v) => v !== undefined);
    }

    async function deleteEntry(userID, entryID) {
      const entries = allEntries[userID];
      if (entries !== undefined) {
        entries[entryID] = undefined;
      }
    }

    async function deleteAllEntries(userID) {
      allEntries[userID] = undefined;
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
