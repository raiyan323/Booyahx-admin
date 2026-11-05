import { account, teams, ADMIN_TEAM_ID } from "../lib/appwrite";

export class AdminAccessDeniedError extends Error {
  constructor() {
    super("This account is not a member of BooyahX Admins.");
    this.name = "AdminAccessDeniedError";
  }
}

export async function checkAdminAccess() {
  const user = await account.get();

  const response = await teams.list();

  const isAdmin = response.teams.some((team) => team.$id === ADMIN_TEAM_ID);

  if (!isAdmin) {
    throw new AdminAccessDeniedError();
  }

  return {
    $id: user.$id,
    name: user.name,
    email: user.email,
  };
}
