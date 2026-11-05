import { DATABASE_ID, ID, Query, TABLES, tablesDB } from "../lib/appwrite";

export type TournamentResult = {
  $id: string;
  tournamentId: string;
  inGameName: string;
  freeFireUid: string;
  position: number;
  prizeAmount: string;
  $updatedAt?: string;
};

// Get all results of a tournament
export async function getTournamentResults(
  tournamentId: string,
): Promise<TournamentResult[]> {
  const response = await tablesDB.listRows({
    databaseId: DATABASE_ID,
    tableId: TABLES.results,
    queries: [
      Query.equal("tournamentId", tournamentId),
      Query.orderAsc("position"),
      Query.limit(100),
    ],
  });

  return response.rows as TournamentResult[];
}

// Admin: Publish a tournament result
export async function createTournamentResult(data: {
  tournamentId: string;
  inGameName: string;
  freeFireUid: string;
  position: number;
  prizeAmount: string;
}) {
  return await tablesDB.createRow({
    databaseId: DATABASE_ID,
    tableId: TABLES.results,
    rowId: ID.unique(),
    data: {
      tournamentId: data.tournamentId,
      inGameName: data.inGameName,
      freeFireUid: data.freeFireUid,
      position: data.position,
      prizeAmount: data.prizeAmount,
    },
  });
}

// Delete a result
export async function deleteTournamentResult(resultId: string) {
  return await tablesDB.deleteRow({
    databaseId: DATABASE_ID,
    tableId: TABLES.results,
    rowId: resultId,
  });
}
