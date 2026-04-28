import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBI0TZHDNZfMM2QVUOwkYhlmhMcxQ6PuV8",
  authDomain: "nba-playoffs-550b5.firebaseapp.com",
  projectId: "nba-playoffs-550b5",
  storageBucket: "nba-playoffs-550b5.firebasestorage.app",
  messagingSenderId: "790208566525",
  appId: "1:790208566525:web:957d573fc5cd73bb39da94",
  measurementId: "G-5X66Z3TGQ2"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();