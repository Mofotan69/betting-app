export type Game = {
  id: string;
  teamA: string;
  teamB: string;
  startTime: string;
  status: "open" | "closed" | "settled";
  result?: string;
};

export type Bet = {
  id: string;
  user: string;
  gameId: string;
  team: string;
  amount: number;
};