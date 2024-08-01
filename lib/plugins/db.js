"use strict";

import fp from "fastify-plugin";
import pg from "@fastify/postgres";
import fs from "fs";
import path from "path";
import { getFileDir } from "../util.js";

const __dirname = getFileDir(import.meta.url);

function sleep(s) {
  return new Promise((resolve) => {
    setTimeout(resolve, s * 1000);
  });
}

async function initDB(fastify) {
  const initSQL = fs.readFileSync(path.join(__dirname, "init.sql"), "utf-8");
  fastify.log.info({ pgURL: fastify.secrets.PG_URL }, "Connect to db attempt");
  let retries = 10;
  while (true) {
    if (retries == 0) {
      throw new Error("Unable to connect to PG for init");
    }
    // setup schema if not present
    let client;
    try {
      client = await fastify.pg.connect();
      await client.query("BEGIN");
      await client.query(initSQL);
      await client.query("COMMIT");
      fastify.log.info("Init db successfully");
      return; // exit loop once successful
    } catch (e) {
      if (client) {
        await client.query("ROLLBACK");
      }
    } finally {
      if (client) {
        client.release();
      }
    }
    await sleep(1); // sleep 1 second before retrying
    retries = retries - 1;
    fastify.log.info(`Retry init DB: ${retries}`);
  }
}

export default fp(
  async function (fastify, opts) {
    await fastify.register(pg, {
      connectionString: fastify.secrets.PG_URL,
    });

    // or async/await style
    fastify.addHook("onListen", async function () {
      await initDB(fastify);
    });
  },
  { name: "db", dependencies: ["application-config"] }
);
