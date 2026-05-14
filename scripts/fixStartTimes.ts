import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

const serviceAccount = require("./serviceAccountKey.json");

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

async function fixStartTimes() {
  const snapshot = await db.collection("games").get();

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();

    if (typeof data.startTime === "string") {
      const converted = Timestamp.fromDate(new Date(data.startTime));

      await db.collection("games").doc(docSnap.id).update({
        startTime: converted,
      });

      console.log(`✅ Fixed: ${docSnap.id}`);
    }
  }

  console.log("🎉 Done fixing startTime");
}

fixStartTimes();