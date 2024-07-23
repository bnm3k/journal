"use strict";

import path from "node:path";
import AutoLoad from "@fastify/autoload";

import config from "./config/config.js";
import { getFileDir } from "./app/util.js";

const __dirname = getFileDir(import.meta.url);

// Pass --options via CLI arguments in command to enable these options.
export const options = {};

export default async function (fastify, opts) {
  console.log(import.meta.url);
  // schemas
  fastify.register(AutoLoad, {
    dir: path.join(__dirname, "schema"),
    indexPattern: /^loader.js$/i,
  });

  // config must be loaded after schemas csince we validate the environment
  // variables through the schema:dotenv schema
  await fastify.register(config);
  fastify.log.info("Env: %s", fastify.secrets.NODE_ENV);

  // Do not touch the following lines

  // This loads all plugins defined in plugins
  // those should be support plugins that are reused
  // through your application
  fastify.register(AutoLoad, {
    dir: path.join(__dirname, "plugins"),
    ignorePattern: /.*.no-load\.js/,
    indexPattern: /^no$/i,
    options: Object.assign({}, fastify.config),
  });

  // This loads all plugins defined in routes
  // define your routes in one of these
  fastify.register(AutoLoad, {
    dir: path.join(__dirname, "routes"),
    indexPattern: /.*routes\.js$/i,
    ignorePattern: /.*\.js/,
    autoHooksPattern: /.*hooks\.js$/i,
    autoHooks: true,
    cascadeHooks: true,
    options: Object.assign({}, opts),
  });
}
