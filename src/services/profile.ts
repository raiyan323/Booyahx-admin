import {
    account,
    DATABASE_ID,
    Permission,
    Role,
    TABLES,
    tablesDB
} from "../lib/appwrite";

export async function getMyProfile() {
  const user = await account.get();

  return await tablesDB.getRow({
    databaseId: DATABASE_ID,
    tableId: TABLES.profiles,
    rowId: user.$id,
  });
}

export async function createMyProfile(inGameName: string, freeFireUid: string) {
  const user = await account.get();

  return await tablesDB.createRow({
    databaseId: DATABASE_ID,
    tableId: TABLES.profiles,
    rowId: user.$id,
    data: {
      userId: user.$id,
      inGameName,
      freeFireUid,
      avatarUrl: "",
    },
    permissions: [
      Permission.read(Role.user(user.$id)),
      Permission.update(Role.user(user.$id)),
    ],
  });
}

export async function updateMyProfile(inGameName: string, freeFireUid: string) {
  const user = await account.get();

  return await tablesDB.updateRow({
    databaseId: DATABASE_ID,
    tableId: TABLES.profiles,
    rowId: user.$id,
    data: {
      inGameName,
      freeFireUid,
    },
  });
}
