"use client"; //Runs code on browser  (chrome)

import { useEffect, useState } from "react"; //useEffect: Runs when something changes, useState: remembers things
import { useRouter, useParams } from "next/navigation"; //useRouter: redirects pages, useParams: retrrieves URL info
import { db, auth } from "@/lib/firebase"; //db: database, auth: login system
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  where,
  doc,
  getDocs,
  updateDoc,
  deleteDoc
} from "firebase/firestore"; //basic database functions
import { onAuthStateChanged } from "firebase/auth"; //detects if user is logged in

type Bet = {
  id: string;
  userId: string;
  user: string;
  gameId: string;
  team: string;
  amount: number;
  payout?: number;
  status?: string;
};

export default function GamePage() {
  const { id } = useParams(); //retrieves game ID from URL "/game/123", "123" is retrieved
  const router = useRouter(); //redirects to login

  // =========================
  // STATE
  // =========================
  const [user, setUser] = useState<any>(null); //updates user info
  const [bets, setBets] = useState<Bet[]>([]); //stores previous bets
  const [game, setGame] = useState<any>(null); //stores games

  const [amount, setAmount] = useState(0); //stores amount user bets
  const [team, setTeam] = useState(""); //stores which team the bet was placed on

  const [myBet, setMyBet] = useState<Bet | null>(null); //stores current user bet

  // =========================
  // AUTH
  // =========================
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => { //listen for login changes
      if (!u) {
        router.push("/login"); //if no user, redirect to login page
      } else { 
        setUser(u); //else save user
      }
    });

    return () => unsub();
  }, []);

  // =========================
  // FETCH GAME
  // =========================
  useEffect(() => {
    if (!id) return;

    const unsub = onSnapshot(doc(db, "games", id as string), (docSnap) => { //listens to current state
      setGame(docSnap.data()); //saves game
    });

    return () => unsub();
  }, [id]); // basically updates the state of the game constantly by listening for updates

  // =========================
  // AUTO SETTLEMENT TRIGGER
  // =========================
  useEffect(() => {
    if (!game || !bets.length) return;

    // If API marked game finished → settle
    if (game.status === "finished" && game.winner) {
      settleGame(game.winner);
    }
  }, [game, bets]);

  // =========================
  // FETCH BETS
  // =========================
  useEffect(() => {
    if (!id) return;

    const q = query(collection(db, "bets"), where("gameId", "==", id)); //gets all bets for this game from the database

    const unsub = onSnapshot(q, (snapshot) => {
      const allBets = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      })) as Bet[];

      setBets(allBets); //same logic as Fetch Games

      // find current user's bet
      if (user) {
        const mine = allBets.find((b) => b.userId === user.uid); //search through the bets list and grab the first bet that belongs to the current user
        setMyBet(mine || null); //saves your bet

        if (mine) {
          setTeam(mine.team);
          setAmount(mine.amount); //Autofills UI
        }
      }
    });

    return () => unsub();
  }, [id, user]);

  // =========================
  // DERIVED DATA
  // =========================
  const totalPot = bets.reduce((sum, b) => sum + (b.amount || 0), 0);

  const teamTotals: any = {};
  bets.forEach((b) => {
    teamTotals[b.team] = (teamTotals[b.team] || 0) + b.amount;
  });

  const getOdds = (team: string) => {
    if (!teamTotals[team] || totalPot === 0) return 0;
    return totalPot / teamTotals[team];
  };

  const getPercentage = (team: string) => {
    if (!totalPot) return 0;
    return ((teamTotals[team] || 0) / totalPot) * 100;
  };

  // =========================
  // LOCK LOGIC
  // =========================
  const isBettingOpen = () => {
    if (!game?.startTime) return false;
    return new Date() < new Date(game.startTime);
  };

  // =========================
  // PLACE / UPDATE BET
  // =========================
  const placeOrUpdateBet = async () => {
    if (!user) return alert("Login first"); //if no user, ask them to login
    if (!isBettingOpen()) return alert("Betting is closed"); //if betting is not open, return betting is closed
    if (!team || amount <= 0) return alert("Invalid bet"); //if amount is less than/ equal to 0, return invalid bet

    if (myBet) {
      // UPDATE (if user already has a bet)
      await updateDoc(doc(db, "bets", myBet.id), {
        team,
        amount
      });
    } else {
      // CREATE (if user hasn't made a bet, only one allowed)
      await addDoc(collection(db, "bets"), {
        userId: user.uid,
        user: user.displayName || "Anonymous",
        gameId: id,
        team,
        amount
      });
    }
  };

  // =========================
  // DELETE BET
  // =========================
  const deleteBet = async () => {
    if (!myBet) return;
    if (!isBettingOpen()) {
      alert("Cannot delete after game starts");
      return; //if betting is closed, return (Cannot delete after game starts)
    }

    await deleteDoc(doc(db, "bets", myBet.id)); //remove from database

    setMyBet(null);
    setTeam("");
    setAmount(0); //delets the bet by resetting things to NULL or 0
  };

  // =========================
  // SETTLE GAME (AUTO)
  // =========================
  const settleGame = async (winner: string) => {
    if (!bets.length || !game) return;

    // Prevent running multiple times
    if (game.status === "settled") return;

    const totalPot = bets.reduce((sum, b) => sum + b.amount, 0);

    const winningBets = bets.filter((b) => b.team === winner);
    const totalWinning = winningBets.reduce((sum, b) => sum + b.amount, 0);

    for (const bet of bets) {
      await Promise.all(
        bets.map((bet) => {
          let payout = 0;

          if (bet.team === winner) {
            payout = (bet.amount / totalWinning) * totalPot;
          }

          return updateDoc(doc(db, "bets", bet.id), {
            payout,
            status: "settled"
        });
        })
      );

    // Mark game as settled
    await updateDoc(doc(db, "games", id as string), {
      status: "settled"
    });
  };

  // =========================
  // UI
  // =========================
  return (
    <div style={{ padding: 20 }}>
      <h2>Game</h2>

      {game && (
        <>
          <h3>
            {game.teamA} vs {game.teamB}
          </h3>
          <p>Status: {game.status || "upcoming"}</p>

          {game.status !== "upcoming" && (
            <p>
              Score: {game.teamA} {game.scoreA || 0} - {game.scoreB || 0} {game.teamB}
            </p>
          )}

          {game.status === "finished" && game.winner && (
            <p><strong>Winner:</strong> {game.winner}</p>
          )}

          <p>Start Time: {new Date(game.startTime).toLocaleString()}</p>
        </>
      )}

      <p><strong>Total Pot:</strong> ${totalPot}</p>

      {/* TEAM SELECTION */}
      <h3>Select Team</h3>

      {game &&
        [game.teamA, game.teamB].map((t) => (
          <div
            key={t}
            onClick={() => isBettingOpen() && setTeam(t)} //Click logic, allows interaction
            style={{
              border: team === t ? "2px solid blue" : "1px solid gray",
              padding: 12,
              marginBottom: 10,
              cursor: isBettingOpen() ? "pointer" : "not-allowed",
              borderRadius: 8,
              opacity: isBettingOpen() ? 1 : 0.6
            }}
          >
            <strong>{t}</strong>
            <div>Odds: {getOdds(t).toFixed(2)}x</div>
            <div>Pool: ${teamTotals[t] || 0}</div>
            <div>{getPercentage(t).toFixed(0)}%</div>
          </div>
        ))}

      {/* BET INPUT */}
      {isBettingOpen() ? (
        <>
          <h3>{myBet ? "Edit Bet" : "Place Bet"}</h3>

          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
          />

          <br /><br />

          <button onClick={placeOrUpdateBet}> {/* Button used to call function */}
            {myBet ? "Update Bet" : "Place Bet"}
          </button> 

          {myBet && (
            <button
              onClick={deleteBet}
              style={{ marginLeft: 10, color: "red" }}
            >
              Delete Bet
            </button>
          )}
        </>
      ) : (
        <p>Betting is locked</p>
      )}

      {/* ALL BETS */}
      <h3 style={{ marginTop: 30 }}>All Bets</h3>

      {bets.map((b) => (
        <div key={b.id}>
          {b.user} — {b.team} — ${b.amount}
          {b.status === "settled" && (
            <> → Won ${b.payout?.toFixed(2) || 0}</>
          )}
        </div>
      ))}
    </div>
  );
  }}