"use client";

import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "@/lib/firebase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const login = async () => {
    await signInWithPopup(auth, provider);
    router.push("/");
  };

  return (
    <div style={styles.container}>
      
      {/* HERO IMAGE */}
      <div style={styles.imageWrapper}>
        <img
          src="/LeSunshine.jpeg" // put image in /public folder
          alt="Hero"
          style={styles.image}
        />
      </div>

      {/* TEXT */}
      <h1 style={styles.title}>Welcome Back</h1>
      <p style={styles.subtitle}>
        Sign in to continue to your dashboard
      </p>

      {/* LOGIN BUTTON */}
      <button onClick={login} style={styles.button}>
        <span style={styles.googleIcon}>G</span>
        Sign in with Google
      </button>

    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(180deg, #0f172a, #020617)",
    color: "white",
    textAlign: "center",
    padding: 20,
  },

  imageWrapper: {
    width: 140,
    height: 140,
    borderRadius: "50%",
    overflow: "hidden",
    marginBottom: 24,
    boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
    border: "2px solid rgba(255,255,255,0.1)",
  },

  image: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },

  title: {
    fontSize: 32,
    fontWeight: 700,
    margin: 0,
  },

  subtitle: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 8,
    marginBottom: 24,
  },

  button: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "12px 18px",
    borderRadius: 12,
    border: "none",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 14,
    color: "white",
    background: "linear-gradient(135deg, #4285F4, #1a73e8)",
    boxShadow: "0 8px 20px rgba(66,133,244,0.3)",
    transition: "all 0.2s ease",
  },

  googleIcon: {
    background: "white",
    color: "#4285F4",
    borderRadius: 6,
    width: 20,
    height: 20,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: 12,
  },
};