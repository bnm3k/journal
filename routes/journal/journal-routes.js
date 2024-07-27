"use strict";
import fp from "fastify-plugin";
import journalDataSource from "./journal-data-source.js";

export default fp(
  async function (fastify, opts) {
    const tags = ["Journal"];
    fastify.register(journalDataSource);

    // list all journal entries
    fastify.route({
      method: "GET",
      url: "/",
      onRequest: fastify.authenticate,
      schema: {
        tags,
      },
      handler: async function getEntries(request, reply) {
        const { id: userID } = request.user;
        const entries = await fastify.journal.getAll(userID);
        return entries;
      },
    });

    // get a single journal entry
    fastify.route({
      method: "GET",
      url: "/:id",
      onRequest: fastify.authenticate,
      schema: {
        tags,
      },
      handler: async function getEntry(request, reply) {
        const { id: userID } = request.user;
        const { id: entryID } = request.params;
        const entry = await fastify.journal.getOne(userID, entryID);
        if (!entry) {
          return null;
        }
        return entry;
      },
    });

    // add new journal entry: title, content, category, date
    fastify.route({
      method: "POST",
      url: "/",
      onRequest: fastify.authenticate,
      schema: {
        tags,
      },
      handler: async function createEntry(request, reply) {
        const { id: userID } = request.user;
        const entry = request.body;
        const entryID = await fastify.journal.addNew(userID, entry);
        return { entryID };
      },
    });

    // edit/update existing journal entry
    fastify.route({
      method: "PUT",
      url: "/:id",
      onRequest: fastify.authenticate,
      schema: {
        tags,
      },
      handler: async function updateEntry(request, reply) {
        const { id: userID } = request.user;
        const { id: entryID } = request.params;
        const update = request.body;
        await fastify.journal.editEntry(userID, entryID, update);
        reply.code(204);
      },
    });

    // delete existing journal entry
    fastify.route({
      method: "DELETE",
      url: "/:id",
      onRequest: fastify.authenticate,
      schema: {
        tags,
      },
      handler: async function deleteEntry(request, reply) {
        const { id: userID } = request.user;
        const { id: entryID } = request.params;
        await fastify.journal.deleteEntry(userID, entryID);
        reply.code(204);
      },
    });
  },
  {
    name: "journal-routes",
    dependencies: ["auth-plugin"],
    encapsulate: true,
  }
);
