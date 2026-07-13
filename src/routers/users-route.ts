import { Elysia, t } from "elysia";
import { registerUser, loginUser, getCurrentUser, logoutUser } from "../services/users-service";

function extractToken(headers: Record<string, string>): string {
  const authHeader = headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("token tidak valid atau token expired");
  }
  return authHeader.substring(7);
}

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
        name: t.String({ maxLength: 100, examples: ["John Doe"] }),
        email: t.String({ format: "email", maxLength: 100, examples: ["john@example.com"] }),
        password: t.String({ minLength: 6, maxLength: 255, examples: ["123456"] }),
      }),
      detail: {
        summary: "Register user baru",
        description: "Mendaftarkan user baru dengan name, email, dan password.",
        tags: ["Users"],
      },
      response: {
        201: t.Object({
          status: t.String({ examples: ["success"] }),
          message: t.String({ examples: ["User registered successfully"] }),
          data: t.Object({
            name: t.String({ examples: ["John Doe"] }),
            email: t.String({ examples: ["john@example.com"] }),
          }),
        }),
        400: t.Object({
          status: t.String({ examples: ["error"] }),
          message: t.String({ examples: ["Email already exists"] }),
          data: t.Null(),
        }),
      },
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
        email: t.String({ format: "email", maxLength: 100, examples: ["john@example.com"] }),
        password: t.String({ minLength: 6, maxLength: 255, examples: ["123456"] }),
      }),
      detail: {
        summary: "Login user",
        description: "Login dengan email dan password. Mengembalikan token session.",
        tags: ["Users"],
      },
      response: {
        200: t.Object({
          data: t.String({ examples: ["550e8400-e29b-41d4-a716-446655440000"] }),
        }),
        401: t.Object({
          status: t.String({ examples: ["error"] }),
          message: t.String({ examples: ["email atau password salah"] }),
        }),
      },
    }
  )
  .get(
    "/api/users",
    async ({ headers, set }) => {
      try {
        const token = extractToken(headers);
        const data = await getCurrentUser(token);
        set.status = 200;
        return { data };
      } catch (error: any) {
        set.status = 401;
        return {
          status: "error",
          message: error.message ?? "token tidak valid atau token expired",
          data: null,
        };
      }
    },
    {
      detail: {
        summary: "Ambil user saat ini",
        description: "Mengembalikan data user berdasarkan token Bearer yang dikirim di header Authorization.",
        tags: ["Users"],
        security: [{ bearerAuth: [] }],
      },
      response: {
        200: t.Object({
          data: t.Object({
            id: t.Number({ examples: [1] }),
            name: t.String({ examples: ["John Doe"] }),
            email: t.String({ examples: ["john@example.com"] }),
            createdAt: t.Date({ examples: [new Date("2024-01-01T00:00:00.000Z")] }),
          }),
        }),
        401: t.Object({
          status: t.String({ examples: ["error"] }),
          message: t.String({ examples: ["token tidak valid atau token expired"] }),
          data: t.Null(),
        }),
      },
    }
  )
  .delete(
    "/api/users/logout",
    async ({ headers, set }) => {
      try {
        const token = extractToken(headers);
        await logoutUser(token);
        set.status = 200;
        return {
          status: "success",
          message: "User logged out successfully",
        };
      } catch (error: any) {
        set.status = 401;
        return {
          status: "error",
          message: error.message ?? "token tidak valid atau token expired",
          data: null,
        };
      }
    },
    {
      detail: {
        summary: "Logout user",
        description: "Menghapus session token (logout). Membutuhkan Bearer Token.",
        tags: ["Users"],
        security: [{ bearerAuth: [] }],
      },
      response: {
        200: t.Object({
          status: t.String({ examples: ["success"] }),
          message: t.String({ examples: ["User logged out successfully"] }),
        }),
        401: t.Object({
          status: t.String({ examples: ["error"] }),
          message: t.String({ examples: ["token tidak valid atau token expired"] }),
          data: t.Null(),
        }),
      },
    }
  );
