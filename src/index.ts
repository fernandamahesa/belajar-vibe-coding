import { Elysia } from "elysia";
import { swagger } from "@elysiajs/swagger";
import { usersRoute } from "./routers/users-route";

export const app = new Elysia()
  .use(
    swagger({
      path: "/docs",
      documentation: {
        info: {
          title: "Belajar Vibe Coding API",
          version: "1.0.0",
          description: "API autentikasi user untuk aplikasi belajar-vibe-coding",
        },
        tags: [
          { name: "Users", description: "Endpoint terkait user & autentikasi" },
        ],
        components: {
          securitySchemes: {
            bearerAuth: {
              type: "http",
              scheme: "bearer",
              bearerFormat: "JWT",
            },
          },
        },
      },
    })
  )
  .get("/", () => "Hello Elysia with Bun!")
  .use(usersRoute);

const isNotTest = !process.argv.some((arg) => arg.includes("bun:test") || arg.includes("--test"));

if (isNotTest) {
  app.listen(process.env.PORT || 3000);
  console.log(
    `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
  );
}
