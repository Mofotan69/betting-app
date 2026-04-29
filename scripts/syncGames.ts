import fetch from "node-fetch";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";

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

// =========================
// FIREBASE CONFIG
// =========================
const firebaseConfig = {
  apiKey: "AIzaSyBI0TZHDNZfMM2QVUOwkYhlmhMcxQ6PuV8",
  authDomain: "nba-playoffs-550b5.firebaseapp.com",
  projectId: "nba-playoffs-550b5",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

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
// MAIN SYNC FUNCTION
// =========================
async function syncNBA() {
  try {
    console.log("Fetching NBA games...");

    const today = new Date();
    const past = new Date();
    const future = new Date();

    past.setDate(today.getDate() - 3);   // recent
    future.setDate(today.getDate() + 3); // upcoming

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

    // 🔍 Defensive check
    if (!data || !Array.isArray(data.data)) {
      console.error("Invalid API response:", data);
      return;
    }

    const games = data.data;

    console.log(`Found ${games.length} games`);

    for (const g of games) {
      const gameId = g.id.toString();

      const status = mapStatus(g.status);

      const homeScore = g.home_team_score || 0;
      const awayScore = g.visitor_team_score || 0;

      const winner =
        status === "finished"
          ? homeScore > awayScore
            ? g.home_team.abbreviation
            : g.visitor_team.abbreviation
          : null;

      const gameDoc = {
        externalId: g.id,
        teamA: g.home_team.abbreviation,
        teamB: g.visitor_team.abbreviation,
        startTime: g.date,
        status,
        scoreA: homeScore,
        scoreB: awayScore,
        winner,
        round: "Regular Season" // can upgrade later to playoffs
      };

      await setDoc(doc(db, "games", gameId), gameDoc, { merge: true });

      console.log(
        `${gameDoc.teamA} vs ${gameDoc.teamB} | ${status} | ${homeScore}-${awayScore}`
      );
    }

    console.log("✅ Sync complete");
  } catch (err) {
    console.error("❌ Sync failed:", err);
  }
}

// =========================
// RUN
// =========================
syncNBA();