"use client";
import { signIn } from "next-auth/react";

export function OpsLoginButton() {
  return <button type="button"
    onClick={() => { void signIn("google", { callbackUrl: "/ops" }); }}
    style={{ margin: "1rem 0", padding: "0.8rem 1.2rem", borderRadius: 10, background: "#215d48", color: "white", cursor: "pointer" }}>
    승인된 Google 계정으로 로그인
  </button>;
}
