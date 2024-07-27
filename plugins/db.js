"use strict";

import fp from "fastify-plugin";
import pg from "@fastify/postgres";
import fs from "fs";
import path from "path";
import { getFileDir } from "../app/util.js";

const __dirname = getFileDir(import.meta.url);

export default fp(
  async function (fastify, opts) {
    await fastify.register(pg, {
      connectionString: fastify.secrets.PG_URL,
    });

    const initSQL = fs.readFileSync(path.join(__dirname, "init.sql"), "utf-8");
    console.log(initSQL);

    // setup schema if not present
    const client = await fastify.pg.connect();
    try {
      await client.query("BEGIN");
      await client.query(initSQL);
      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  },
  { name: "db", dependencies: ["application-config"] }
);
