import { describe, test, expect, beforeEach } from "bun:test";
import { app } from "../src/index";
import { db } from "../src/db";
import { users, sessions } from "../src/db/schema";
import { eq } from "drizzle-orm";

let testCounter = 0;

function getTestEmail() {
  testCounter++;
  return `test-${Date.now()}-${testCounter}@mail.com`;
}

const TEST_NAME = "Test User";
const TEST_PASSWORD = "123456";

async function cleanup() {
  await db.delete(sessions);
  await db.delete(users);
}

async function registerUser(overrides: Record<string, string> = {}) {
  const email = overrides.email ?? getTestEmail();
  const res = await app.handle(
    new Request("http://localhost/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: TEST_NAME,
        email,
        password: TEST_PASSWORD,
        ...overrides,
      }),
    })
  );
  return { res, body: await res.json(), email };
}

async function loginUser(
  email: string,
  password: string = TEST_PASSWORD
) {
  const res = await app.handle(
    new Request("http://localhost/api/users/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
  );
  return { res, body: await res.json() };
}

async function getCurrentUser(token?: string) {
  const headers: Record<string, string> = {};
  if (token !== undefined) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await app.handle(
    new Request("http://localhost/api/users", {
      method: "GET",
      headers,
    })
  );
  return { res, body: await res.json() };
}

async function logoutUser(token?: string) {
  const headers: Record<string, string> = {};
  if (token !== undefined) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await app.handle(
    new Request("http://localhost/api/users/logout", {
      method: "DELETE",
      headers,
    })
  );
  return { res, body: await res.json() };
}

async function getSessionByToken(token: string) {
  const result = await db
    .select()
    .from(sessions)
    .where(eq(sessions.token, token))
    .limit(1);
  return result[0];
}

async function getUserIdByEmail(email: string) {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  return result[0]?.id;
}

describe("POST /register", () => {
  beforeEach(async () => {
    await cleanup();
  });

  test("success: register user baru dengan data valid", async () => {
    const { res, body, email } = await registerUser();
    expect(res.status).toBe(201);
    expect(body.status).toBe("success");
    expect(body.message).toBe("User registered successfully");
    expect(body.data.name).toBe(TEST_NAME);
    expect(body.data.email).toBe(email);
  });

  test("error: email sudah terdaftar", async () => {
    const { email } = await registerUser();
    const { res, body } = await registerUser({ email });
    expect(res.status).toBe(400);
    expect(body.status).toBe("error");
    expect(body.message).toBe("Email already exists");
  });

  test("error: format email tidak valid", async () => {
    const { res, body } = await registerUser({ email: "bukan-email" });
    expect(res.status).toBe(422);
    expect(body.type).toBe("validation");
  });

  test("error: password kurang dari 6 karakter", async () => {
    const { res, body } = await registerUser({ password: "12345" });
    expect(res.status).toBe(422);
    expect(body.type).toBe("validation");
  });

  test("error: name lebih dari 100 karakter", async () => {
    const { res, body } = await registerUser({
      name: "a".repeat(101),
    });
    expect(res.status).toBe(422);
    expect(body.type).toBe("validation");
  });

  test("error: field kosong", async () => {
    const res = await app.handle(
      new Request("http://localhost/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
    );
    const body = await res.json();
    expect(res.status).toBe(422);
    expect(body.type).toBe("validation");
  });
});

describe("POST /api/users/login", () => {
  let registeredEmail: string;

  beforeEach(async () => {
    await cleanup();
    const { email } = await registerUser();
    registeredEmail = email;
  });

  test("success: login dengan credentials benar", async () => {
    const { res, body } = await loginUser(registeredEmail);
    expect(res.status).toBe(200);
    expect(body.data).toBeDefined();
    expect(typeof body.data).toBe("string");
  });

  test("error: email tidak terdaftar", async () => {
    const { res, body } = await loginUser("notfound@mail.com");
    expect(res.status).toBe(401);
    expect(body.status).toBe("error");
    expect(body.message).toBe("email atau password salah");
  });

  test("error: password salah", async () => {
    const { res, body } = await loginUser(registeredEmail, "wrongpass");
    expect(res.status).toBe(401);
    expect(body.status).toBe("error");
    expect(body.message).toBe("email atau password salah");
  });

  test("error: format email tidak valid", async () => {
    const { res, body } = await loginUser("bukan-email");
    expect(res.status).toBe(422);
    expect(body.type).toBe("validation");
  });

  test("error: field kosong", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
    );
    const body = await res.json();
    expect(res.status).toBe(422);
    expect(body.type).toBe("validation");
  });
});

describe("GET /api/users", () => {
  let token: string;
  let registeredEmail: string;

  beforeEach(async () => {
    await cleanup();
    const { email } = await registerUser();
    registeredEmail = email;
    const { body } = await loginUser(registeredEmail);
    token = body.data;
  });

  test("success: ambil data user dengan token valid", async () => {
    const { res, body } = await getCurrentUser(token);
    expect(res.status).toBe(200);
    expect(body.data.name).toBe(TEST_NAME);
    expect(body.data.email).toBe(registeredEmail);
    expect(body.data.id).toBeDefined();
    expect(body.data.createdAt).toBeDefined();
  });

  test("error: token tidak dikirim", async () => {
    const { res, body } = await getCurrentUser(undefined);
    expect(res.status).toBe(401);
    expect(body.status).toBe("error");
    expect(body.message).toBe("token tidak valid atau token expired");
  });

  test("error: token tidak valid", async () => {
    const { res, body } = await getCurrentUser("random-token-tidak-ada");
    expect(res.status).toBe(401);
    expect(body.status).toBe("error");
    expect(body.message).toBe("token tidak valid atau token expired");
  });

  test("error: token expired", async () => {
    const userId = await getUserIdByEmail(registeredEmail);
    const expiredToken = crypto.randomUUID();
    await db.insert(sessions).values({
      token: expiredToken,
      userId: userId!,
      expiredAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    });
    const { res, body } = await getCurrentUser(expiredToken);
    expect(res.status).toBe(401);
    expect(body.status).toBe("error");
    expect(body.message).toBe("token tidak valid atau token expired");
  });

  test("error: header tanpa prefix Bearer", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/users", {
        method: "GET",
        headers: { Authorization: token },
      })
    );
    const body = await res.json();
    expect(res.status).toBe(401);
    expect(body.status).toBe("error");
  });
});

describe("DELETE /api/users/logout", () => {
  let token: string;
  let registeredEmail: string;

  beforeEach(async () => {
    await cleanup();
    const { email } = await registerUser();
    registeredEmail = email;
    const { body } = await loginUser(registeredEmail);
    token = body.data;
  });

  test("success: logout dengan token valid", async () => {
    const { res, body } = await logoutUser(token);
    expect(res.status).toBe(200);
    expect(body.status).toBe("success");
    expect(body.message).toBe("User logged out successfully");
    const session = await getSessionByToken(token);
    expect(session).toBeUndefined();
  });

  test("error: token tidak dikirim", async () => {
    const { res, body } = await logoutUser(undefined);
    expect(res.status).toBe(401);
    expect(body.status).toBe("error");
    expect(body.message).toBe("token tidak valid atau token expired");
  });

  test("error: token tidak valid", async () => {
    const { res, body } = await logoutUser("random-token-tidak-ada");
    expect(res.status).toBe(401);
    expect(body.status).toBe("error");
    expect(body.message).toBe("token tidak valid atau token expired");
  });

  test("error: token sudah digunakan logout sebelumnya", async () => {
    await logoutUser(token);
    const { res, body } = await logoutUser(token);
    expect(res.status).toBe(401);
    expect(body.status).toBe("error");
    expect(body.message).toBe("token tidak valid atau token expired");
  });

  test("error: header tanpa prefix Bearer", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/users/logout", {
        method: "DELETE",
        headers: { Authorization: token },
      })
    );
    const body = await res.json();
    expect(res.status).toBe(401);
    expect(body.status).toBe("error");
  });
});
