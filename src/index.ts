import { Elysia } from "elysia";
import { db } from "./db";
import { users } from "./db/schema";

const app = new Elysia()
  .get("/", () => "Hello Elysia with Bun!")
  .get("/users", async () => {
    try {
      return await db.select().from(users);
    } catch (error) {
      return { error: "Database connection failed or table does not exist." };
    }
  })
  .post("/users", async ({ body }: { body: { name: string; email: string } }) => {
    try {
      await db.insert(users).values(body);
      return { success: true };
    } catch (error) {
      return { error: "Failed to insert user." };
    }
  })
  .listen(process.env.PORT || 3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
