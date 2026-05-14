const admin = require("firebase-admin");

const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function fixStartTimes() {
  const snapshot = await db.collection("games").get();

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();

    if (typeof data.startTime === "string") {
      const converted = admin.firestore.Timestamp.fromDate(
        new Date(data.startTime)
      );

      await db.collection("games").doc(docSnap.id).update({
        startTime: converted,
      });

      console.log(`✅ Fixed: ${docSnap.id}`);
    }
  }

  console.log("🎉 Done fixing startTime");
}

fixStartTimes();