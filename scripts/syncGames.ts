import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

console.log("API Key exists:", !!process.env.BALLDONTLIE_API_KEY);
import fetch from "node-fetch";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  doc,
  setDoc,
  Timestamp,
  collection,
  getDocs,
  deleteDoc
} from "firebase/firestore";
// =========================
// TYPES
// =========================
type Game = {
  id: number;
  date: string;
  status: string;
  postseason?: boolean;

  home_team_score: number;
  visitor_team_score: number;

  home_team: {
    abbreviation: string;
  };

  visitor_team: {
    abbreviation: string;
  };
};

type APIResponse = {
  data: Game[];
};

// =========================
// FIREBASE CONFIG
// =========================
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// =========================
// STATUS MAPPING
// Converts API status → app status
// =========================
const mapStatus = (status: string) => {
  if (status === "Final") return "finished";

  if (
    status === "In Progress" ||
    status === "Halftime"
  ) {
    return "live";
  }

  return "upcoming";
};

// =========================
// MAIN SYNC FUNCTION
// =========================
async function syncNBA() {
  try {
    console.log("🏀 Fetching NBA games...");

    const today = new Date();
    const past = new Date();
    const future = new Date();

    past.setDate(today.getDate() - 7);
    future.setDate(today.getDate() + 7);

    const startDate = past.toISOString().split("T")[0];
    const endDate = future.toISOString().split("T")[0];

    const res = await fetch(
      `https://api.balldontlie.io/v1/games?start_date=${startDate}&end_date=${endDate}`,
      {
        headers: {
          Authorization: process.env.BALLDONTLIE_API_KEY!,
        },
      }
    );

    const data = (await res.json()) as APIResponse;

    if (!data || !Array.isArray(data.data)) {
      console.error("Invalid API response:", data);
      return;
    }

    const games = data.data.sort(
      (a, b) =>
        new Date(a.date).getTime() -
        new Date(b.date).getTime()
    );

    console.log(`Found ${games.length} games`);

    const validIds = new Set(games.map(g => g.id.toString()));

    // =================================================
    // PHASE 1: BUILD SERIES WINS (ONLY FINISHED GAMES)
    // =================================================
    const seriesWins: Record<string, Record<string, number>> = {};

    for (const g of games) {
      if (!g.postseason) continue;
      if (mapStatus(g.status) !== "finished") continue;

      const teamA = g.home_team.abbreviation;
      const teamB = g.visitor_team.abbreviation;

      const matchupKey = [teamA, teamB].sort().join("-");

      if (!seriesWins[matchupKey]) {
        seriesWins[matchupKey] = {};
      }

      const winner =
        g.home_team_score > g.visitor_team_score
          ? teamA
          : teamB;

      seriesWins[matchupKey][winner] =
        (seriesWins[matchupKey][winner] || 0) + 1;
    }

    // =================================================
    // PHASE 2: PROCESS GAMES (DETERMINE FINAL STATE)
    // =================================================
    for (const g of games) {
      const gameId = g.id.toString();

      const teamA = g.home_team.abbreviation;
      const teamB = g.visitor_team.abbreviation;

      const status = mapStatus(g.status);

      const homeScore = g.home_team_score || 0;
      const awayScore = g.visitor_team_score || 0;

      const matchupKey = [teamA, teamB].sort().join("-");
      const wins = seriesWins[matchupKey] || {};

      const seriesOver =
        (wins[teamA] || 0) >= 4 ||
        (wins[teamB] || 0) >= 4;

      const isPlaceholder =
        status === "upcoming" && seriesOver;

      const isCancelled = isPlaceholder;

      const winner =
        status === "finished"
          ? homeScore > awayScore
            ? teamA
            : teamB
          : null;

      const gameDoc = {
        externalId: g.id,
        teamA,
        teamB,

        startTime: Timestamp.fromDate(new Date(g.date)),

        status,
        scoreA: homeScore,
        scoreB: awayScore,

        winner,
        postseason: g.postseason || false,

        isCancelled,
      };
      // 🔴 GUARDRAIL TO PREVENT STRINGS BEING DISPLAYED AS STARTTIME
      if (typeof gameDoc.startTime === "string") {
        throw new Error("startTime must be Timestamp");
      }
      // has to be added here as the next line starts writing the data into firestore already

      await setDoc(doc(db, "games", gameId), gameDoc);

      console.log(
        `${teamA} vs ${teamB} | ${status} | ${homeScore}-${awayScore} | cancelled=${isCancelled}`
      );
    }

    // =================================================
    // PHASE 3: CLEANUP STALE DOCS
    // =================================================
    const snapshot = await getDocs(collection(db, "games"));

    for (const docSnap of snapshot.docs) {
      if (!validIds.has(docSnap.id)) {
        console.log("Deleting stale game:", docSnap.id);
        await deleteDoc(docSnap.ref);
      }
    }

    console.log("✅ Sync complete");
  } catch (err) {
    console.error("❌ Sync failed:", err);
  }
}

// =========================
// RUN SCRIPT
// =========================
syncNBA();