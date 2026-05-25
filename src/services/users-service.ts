import { db } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";

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
