// scripts/seedGames.ts
import { db } from "../lib/firebase";
import { addDoc, collection, Timestamp } from "firebase/firestore";

async function seed() {
  await addDoc(collection(db, "games"), {
    teamA: "Lakers",
    teamB: "Warriors",
    status: "open",
    startTime: Timestamp.fromDate(new Date())
  });

  console.log("Seeded!");
}

seed();