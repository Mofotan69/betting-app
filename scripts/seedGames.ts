// scripts/seedGames.ts
import { db } from "../lib/firebase";
import { addDoc, collection } from "firebase/firestore";

async function seed() {
  await addDoc(collection(db, "games"), {
    teamA: "Lakers",
    teamB: "Warriors",
    status: "open",
    startTime: new Date().toISOString()
  });

  console.log("Seeded!");
}

seed();