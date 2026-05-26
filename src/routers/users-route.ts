import { Elysia, t } from "elysia";
import { registerUser, loginUser } from "../services/users-service";

export const usersRoute = new Elysia()
  .post(
    "/register",
    async ({ body, set }) => {
      try {
        const data = await registerUser(body);
        set.status = 201;
        return {
          status: "success",
          message: "User registered successfully",
          data,
        };
      } catch (error: any) {
        set.status = 400;
        return {
          status: "error",
          message: error.message ?? "Registration failed",
          data: null,
        };
      }
    },
    {
      body: t.Object({
        name: t.String(),
        email: t.String({ format: "email" }),
        password: t.String({ minLength: 6 }),
      }),
    }
  )
  .post(
    "/api/users/login",
    async ({ body, set }) => {
      try {
        const data = await loginUser(body.email, body.password);
        set.status = 200;
        return {
          data: data.token,
        };
      } catch (error: any) {
        set.status = 401;
        return {
          status: "error",
          message: error.message ?? "Login failed",
        };
      }
    },
    {
      body: t.Object({
        email: t.String({ format: "email" }),
        password: t.String({ minLength: 6 }),
      }),
    }
  );
