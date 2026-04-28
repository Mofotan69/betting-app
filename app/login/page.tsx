"use client";

import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "@/lib/firebase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const login = async () => {
    await signInWithPopup(auth, provider);
    router.push("/"); // redirect after login
  };

  return (
    <div style={{ padding: 40 }}>
      <h1>Login</h1>

      <button onClick={login}>
        Sign in with Google
      </button>
    </div>
  );
}