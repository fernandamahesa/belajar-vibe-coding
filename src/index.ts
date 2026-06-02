import { Elysia } from "elysia";
import { usersRoute } from "./routers/users-route";

export const app = new Elysia()
  .get("/", () => "Hello Elysia with Bun!")
  .use(usersRoute);

const isNotTest = !process.argv.some((arg) => arg.includes("bun:test") || arg.includes("--test"));

if (isNotTest) {
  app.listen(process.env.PORT || 3000);
  console.log(
    `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
  );
}
