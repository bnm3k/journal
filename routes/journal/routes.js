"use strict";

export default async function (fastify, opts) {
  // list all journal entries
  fastify.route({
    method: "GET",
    url: "/",
    handler: async function getEntries(request, reply) {
      return { data: [], totalCount: 0 };
    },
  });

  // get a single journal entry
  fastify.route({
    method: "GET",
    url: "/:id",
    handler: async function getEntry(request, reply) {
      return {};
    },
  });

  // add new journal entry: title, content, category, date
  fastify.route({
    method: "POST",
    url: "/",
    handler: async function createEntry(request, reply) {
      return { id: "123" };
    },
  });

  // edit/update existing journal entry
  fastify.route({
    method: "PUT",
    url: "/:id",
    handler: async function updateEntry(request, reply) {
      reply.code(204);
    },
  });

  // delete existing journal entry
  fastify.route({
    method: "DELETE",
    url: "/:id",
    handler: async function deleteEntry(request, reply) {
      reply.code(204);
    },
  });

  // get summary of journal entries over a selected period: daily, weekly,
  // monthly
  fastify.route({
    method: "GET",
    url: "/",
    handler: async function getSummary(request, reply) {
      return { data: [], totalCount: 0 };
    },
  });
}
