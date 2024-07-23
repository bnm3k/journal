# Getting Started with [Fastify-CLI](https://www.npmjs.com/package/fastify-cli)

This project was bootstrapped with Fastify-CLI.

## Available Scripts

In the project directory, you can run:

### `npm run dev`

To start the app in dev mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

### `npm start`

For production mode

### `npm run test`

Run the test cases.

# Plugins Folder

Plugins define behavior that is common to all the routes in the application.
Authentication, caching, templates, and all the other cross cutting concerns
should be handled by plugins placed in this folder.

Files in this folder are typically defined through the
[`fastify-plugin`](https://github.com/fastify/fastify-plugin) module, making
them non-encapsulated. They can define decorators and set hooks that will then
be used in the rest of your application.

Check out:

- [The hitchhiker's guide to plugins](https://fastify.dev/docs/latest/Guides/Plugins-Guide/)
- [Fastify decorators](https://fastify.dev/docs/latest/Reference/Decorators/).
- [Fastify lifecycle](https://fastify.dev/docs/latest/Reference/Lifecycle/).

## Routes Folder

Routes define routes within the application.

If a single file becomes too large, create a folder and add a `index.js` file
there: this file must be a Fastify plugin, and it will be loaded automatically
by the application. You can now add as many files as you want inside that
folder. In this way you can create complex routes within a single monolith, and
eventually extract them.

## Learn More

To learn Fastify, check out the
[Fastify documentation](https://fastify.dev/docs/latest/).
