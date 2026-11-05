import {
  account,
  DATABASE_ID,
  ADMIN_TEAM_ID,
  ID,
  Permission,
  Query,
  Role,
  TABLES,
  tablesDB,
} from "../lib/appwrite";

// ==========================================
// TOURNAMENTS
// ==========================================

// Get all tournaments
export async function getTournaments() {
  return await tablesDB.listRows({
    databaseId: DATABASE_ID,
    tableId: TABLES.tournaments,
    queries: [Query.orderDesc("$createdAt"), Query.limit(100)],
  });
}

// Get a single tournament
export async function getTournament(id: string) {
  return await tablesDB.getRow({
    databaseId: DATABASE_ID,
    tableId: TABLES.tournaments,
    rowId: id,
  });
}

// ==========================================
// PLAYER: JOIN TOURNAMENT
// ==========================================

export async function joinTournament(
  tournamentId: string,
  inGameName: string,
  freeFireUid: string,
) {
  const user = await account.get();

  // Prevent duplicate requests
  const existingRequests = await tablesDB.listRows({
    databaseId: DATABASE_ID,
    tableId: TABLES.requests,
    queries: [
      Query.equal("userId", user.$id),
      Query.equal("tournamentId", tournamentId),
      Query.limit(1),
    ],
  });

  if (existingRequests.rows.length > 0) {
    throw new Error("You have already requested to join this tournament.");
  }

  return await tablesDB.createRow({
    databaseId: DATABASE_ID,
    tableId: TABLES.requests,
    rowId: ID.unique(),
    data: {
      tournamentId,
      userId: user.$id,
      inGameName,
      freeFireUid,
      status: "pending",
    },
    permissions: [
      // Player can read their own request
      Permission.read(Role.user(user.$id)),

      // Admin team can read and update requests
      Permission.read(Role.team(ADMIN_TEAM_ID)),
      Permission.update(Role.team(ADMIN_TEAM_ID)),
    ],
  });
}

// ==========================================
// PLAYER: GET MY REQUESTS
// ==========================================

export async function getMyRequests() {
  const user = await account.get();

  return await tablesDB.listRows({
    databaseId: DATABASE_ID,
    tableId: TABLES.requests,
    queries: [
      Query.equal("userId", user.$id),
      Query.orderDesc("$createdAt"),
      Query.limit(100),
    ],
  });
}

// ==========================================
// ADMIN: GET ALL PLAYER REQUESTS
// ==========================================

export async function getAllRequests() {
  return await tablesDB.listRows({
    databaseId: DATABASE_ID,
    tableId: TABLES.requests,
    queries: [Query.orderDesc("$createdAt"), Query.limit(100)],
  });
}

// ==========================================
// ADMIN: APPROVE PLAYER REQUEST
// ==========================================

export async function approveRequest(requestId: string) {
  const request = await tablesDB.getRow({
    databaseId: DATABASE_ID,
    tableId: TABLES.requests,
    rowId: requestId,
  });

  if (request.status !== "pending") {
    throw new Error("This request has already been processed.");
  }

  return await tablesDB.updateRow({
    databaseId: DATABASE_ID,
    tableId: TABLES.requests,
    rowId: requestId,
    data: {
      status: "approved",
    },
  });
}

// ==========================================
// ADMIN: REJECT PLAYER REQUEST
// ==========================================

export async function rejectRequest(requestId: string) {
  const request = await tablesDB.getRow({
    databaseId: DATABASE_ID,
    tableId: TABLES.requests,
    rowId: requestId,
  });

  if (request.status !== "pending") {
    throw new Error("This request has already been processed.");
  }

  return await tablesDB.updateRow({
    databaseId: DATABASE_ID,
    tableId: TABLES.requests,
    rowId: requestId,
    data: {
      status: "rejected",
    },
  });
}

// ==========================================
// ROOM DETAILS
// ==========================================

export async function getRoomDetails(tournamentId: string) {
  return await tablesDB.listRows({
    databaseId: DATABASE_ID,
    tableId: TABLES.rooms,
    queries: [Query.equal("tournamentId", tournamentId), Query.limit(1)],
  });
}
