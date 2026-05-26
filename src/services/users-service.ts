import { db } from "../db";
import { users, sessions } from "../db/schema";
import { eq, and, gt } from "drizzle-orm";

export interface RegisterPayload {
  name: string;
  email: string;
  password?: string;
}

export async function registerUser({ name, email, password }: Required<RegisterPayload>) {
  // 1. Check if email already exists
  const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existingUser.length > 0) {
    throw new Error("Email already exists");
  }

  // 2. Hash password using Bun's native bcrypt implementation
  const hashedPassword = await Bun.password.hash(password, {
    algorithm: "bcrypt",
    cost: 10,
  });

  // 3. Save new user to database
  await db.insert(users).values({
    name,
    email,
    password: hashedPassword,
  });

  // 4. Return user info
  return {
    name,
    email,
  };
}

export async function loginUser(email: string, password: string) {
  const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existingUser.length === 0) {
    throw new Error("email atau password salah");
  }

  const user = existingUser[0];
  const isPasswordValid = await Bun.password.verify(password, user.password);
  if (!isPasswordValid) {
    throw new Error("email atau password salah");
  }

  const token = crypto.randomUUID();
  const expiredAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await db.insert(sessions).values({
    token,
    userId: user.id,
    expiredAt,
  });

  return { token };
}

export async function getCurrentUser(token: string) {
  const session = await db
    .select()
    .from(sessions)
    .where(and(eq(sessions.token, token), gt(sessions.expiredAt, new Date())))
    .limit(1);

  if (session.length === 0) {
    throw new Error("token tidak valid atau token expired");
  }

  const user = await db
    .select()
    .from(users)
    .where(eq(users.id, session[0].userId))
    .limit(1);

  if (user.length === 0) {
    throw new Error("token tidak valid atau token expired");
  }

  return {
    id: user[0].id,
    name: user[0].name,
    email: user[0].email,
    createdAt: user[0].createdAt,
  };
}

export async function logoutUser(token: string) {
  const session = await db
    .select()
    .from(sessions)
    .where(and(eq(sessions.token, token), gt(sessions.expiredAt, new Date())))
    .limit(1);

  if (session.length === 0) {
    throw new Error("token tidak valid atau token expired");
  }

  await db.delete(sessions).where(eq(sessions.token, token));
}
