import { db } from "../lib/firebase";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  Timestamp
} from "firebase/firestore";

async function migrate() {
  const snapshot = await getDocs(collection(db, "games"));

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();

    // 🔴 ONLY FIX BAD STRING FIELDS
    if (typeof data.startTime === "string") {
      console.log("Fixing:", docSnap.id);

      await updateDoc(doc(db, "games", docSnap.id), {
        startTime: Timestamp.fromDate(new Date(data.startTime))
      });
    }
  }

  console.log("Migration complete");
}

migrate();