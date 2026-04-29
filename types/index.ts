type Game = {
  id: number;
  userId: string;
  date: string;
  status: string;
  home_team_score: number;
  visitor_team_score: number;
  home_team: { abbreviation: string };
  visitor_team: { abbreviation: string };
};

type APIResponse = {
  data: Game[];
};

export type Bet = {
  id: string;
  user: string;
  gameId: string;
  team: string;
  amount: number;
};