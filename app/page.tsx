"use client";

import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { useEffect, useState } from "react";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function Home() {
  const [games, setGames] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);

  const router = useRouter();

  // =========================
  // AUTH GUARD
  // =========================
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) {
        router.push("/login");
      } else {
        setUser(u);
      }
    });

    return () => unsub();
  }, []);

  // =========================
  // FETCH GAMES (REALTIME)
  // =========================
  useEffect(() => {
    const q = query(collection(db, "games"), orderBy("startTime", "desc"));

    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));

      setGames(data);
    });

    return () => unsub();
  }, []);

  // =========================
  // FILTER GAMES (LAST 7 DAYS + FUTURE)
  // =========================
  const now = new Date();

  const pastLimit = new Date();
  pastLimit.setDate(now.getDate() - 7);

  const filteredGames = games.filter((g) => {
    if (!g.startTime) return false;

    const gameDate = new Date(g.startTime);

    // keep only games within last 7 days or future
    return gameDate >= pastLimit;
  });

  // =========================
  // GROUP GAMES BY STATUS
  // =========================
  const grouped: any = {
    upcoming: [],
    live: [],
    finished: []
  };

  filteredGames.forEach((g) => {
    if (!grouped[g.status]) grouped[g.status] = [];
    grouped[g.status].push(g);
  });

  const renderGame = (game: any) => (
    <Link key={game.id} href={`/game/${game.id}`}>
      <div
        style={{
          border: "1px solid #ccc",
          padding: 12,
          marginBottom: 10,
          borderRadius: 8,
          cursor: "pointer"
        }}
      >
        <strong>
          {game.teamA} vs {game.teamB}
        </strong>

        <div style={{ fontSize: 14, marginTop: 4 }}>
          Status: {game.status}
        </div>

        <div style={{ fontSize: 14 }}>
          Start: {new Date(game.startTime).toLocaleString()}
        </div>

        {game.status !== "upcoming" && (
          <div style={{ marginTop: 6 }}>
            Score: {game.scoreA} - {game.scoreB}
          </div>
        )}

        {game.winner && (
          <div style={{ color: "green", marginTop: 4 }}>
            Winner: {game.winner}
          </div>
        )}
      </div>
    </Link>
  );

  // =========================
  // UI
  // =========================
  return (
    <div style={{ padding: 20, maxWidth: 600, margin: "0 auto" }}>
      <h1>NBA Betting Pool</h1>

      {/* LIVE */}
      {grouped.live.length > 0 && (
        <>
          <h2>🔴 Live Games</h2>
          {grouped.live.map(renderGame)}
        </>
      )}

      {/* UPCOMING */}
      {grouped.upcoming.length > 0 && (
        <>
          <h2>🟡 Upcoming Games</h2>
          {grouped.upcoming.map(renderGame)}
        </>
      )}

      {/* FINISHED */}
      {grouped.finished.length > 0 && (
        <>
          <h2>⚫ Finished Games</h2>
          {grouped.finished.map(renderGame)}
        </>
      )}
    </div>
  );
}