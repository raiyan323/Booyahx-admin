import { account, ID } from "../lib/appwrite";

export async function register(name: string, email: string, password: string) {
  const user = await account.create({
    userId: ID.unique(),
    name,
    email,
    password,
  });

  await login(email, password);

  return user;
}

export async function login(email: string, password: string) {
  return await account.createEmailPasswordSession({
    email,
    password,
  });
}

export async function logout() {
  return await account.deleteSession({
    sessionId: "current",
  });
}

export async function getCurrentUser() {
  try {
    return await account.get();
  } catch {
    return null;
  }
}
