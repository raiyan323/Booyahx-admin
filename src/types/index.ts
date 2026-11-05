export interface PlayerProfile {
  $id: string;
  userId: string;
  inGameName: string;
  freeFireUid: string;
  avatarUrl?: string;
}

export interface Tournament {
  $id: string;
  title: string;
  description: string;
  mode: string;
  map: string;
  teamType: string;
  visibility: "public" | "private";
  startAt: string;
  maxSlots: number;
  status: string;
}

export interface TournamentRequest {
  $id: string;
  tournamentId: string;
  userId: string;
  inGameName: string;
  freeFireUid: string;
  status: "pending" | "approved" | "rejected";
}

export interface RoomDetails {
  $id: string;
  tournamentId: string;
  roomId: string;
  roomPassword: string;
}
