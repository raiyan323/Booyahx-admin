import "react-native-url-polyfill/auto";

import {
  Account,
  Client,
  ID,
  Permission,
  Query,
  Role,
  TablesDB,
  Teams,
} from "react-native-appwrite";

const endpoint = process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT!;
const projectId = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID!;
const platform = process.env.EXPO_PUBLIC_APPWRITE_PLATFORM!;

const client = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId)
  .setPlatform(platform);

export const account = new Account(client);
export const tablesDB = new TablesDB(client);
export const teams = new Teams(client);

export { ID, Permission, Query, Role };

export const DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID!;

export const ADMIN_TEAM_ID = process.env.EXPO_PUBLIC_APPWRITE_ADMIN_TEAM_ID!;

export const TABLES = {
  profiles: process.env.EXPO_PUBLIC_APPWRITE_PROFILES_TABLE_ID!,
  tournaments: process.env.EXPO_PUBLIC_APPWRITE_TOURNAMENTS_TABLE_ID!,
  requests: process.env.EXPO_PUBLIC_APPWRITE_REQUESTS_TABLE_ID!,
  rooms: process.env.EXPO_PUBLIC_APPWRITE_ROOMS_TABLE_ID!,
  news: process.env.EXPO_PUBLIC_APPWRITE_NEWS_TABLE_ID!,
  results: process.env.EXPO_PUBLIC_APPWRITE_RESULTS_TABLE_ID!,
};
