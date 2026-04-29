import { scheduler } from "firebase-functions/v2";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

initializeApp();
const db = getFirestore();

// =========================
// STATUS MAPPING
// =========================
const mapStatus = (status: string) => {
  if (status === "Final") return "finished";
  if (status === "In Progress") return "live";
  if (status === "Halftime") return "live";
  return "upcoming";
};

// =========================
// TYPES (fix TS errors)
// =========================
type Game = {
  id: number;
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

// =========================
// SCHEDULED FUNCTION (v2)
// =========================
export const syncGames = scheduler.onSchedule("every 1 minutes", async () => {
  console.log("Running NBA sync...");

  const today = new Date();
  const past = new Date();
  const future = new Date();

  past.setDate(today.getDate() - 3);
  future.setDate(today.getDate() + 3);

  const startDate = past.toISOString().split("T")[0];
  const endDate = future.toISOString().split("T")[0];

  const res = await fetch(
    `https://api.balldontlie.io/v1/games?start_date=${startDate}&end_date=${endDate}`,
    {
      headers: {
        Authorization: "060d2a7e-0720-4cfa-b47b-ed4f9ebc84b8"
      }
    }
  );

  const data = (await res.json()) as APIResponse;

  if (!data || !Array.isArray(data.data)) {
    console.error("Invalid API response:", data);
    return;
  }

  const batch = db.batch();

  for (const g of data.data) {
    const gameRef = db.collection("games").doc(g.id.toString());

    const status = mapStatus(g.status);

    const homeScore = g.home_team_score || 0;
    const awayScore = g.visitor_team_score || 0;

    const winner =
      status === "finished"
        ? homeScore > awayScore
          ? g.home_team.abbreviation
          : g.visitor_team.abbreviation
        : null;

    batch.set(
      gameRef,
      {
        externalId: g.id,
        teamA: g.home_team.abbreviation,
        teamB: g.visitor_team.abbreviation,
        startTime: g.date,
        status,
        scoreA: homeScore,
        scoreB: awayScore,
        winner
      },
      { merge: true }
    );
  }

  await batch.commit();

  console.log("✅ Sync complete");
});