import { Elysia } from "elysia";
import { usersRoute } from "./routers/users-route";

const app = new Elysia()
  .get("/", () => "Hello Elysia with Bun!")
  .use(usersRoute)
  .listen(process.env.PORT || 3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
