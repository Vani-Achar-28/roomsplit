import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { api } from "../api";

export default function AuthPage({ mode }: { mode: "login" | "signup" }) {
  const isSignup = mode === "signup";
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post(
        isSignup ? "/auth/register" : "/auth/login",
        isSignup ? { name, email, password } : { email, password }
      );
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      navigate("/choose");
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error ?? "Cannot reach the server");
      } else {
        setError("Something went wrong");
      }
    } finally {
      setLoading(false);
    }
  }

  const input = "w-full rounded-lg border border-gray-300 px-4 py-3";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-6">
      <form onSubmit={handleSubmit} className="w-full max-w-xs space-y-3">
        <h1 className="text-2xl font-bold text-primary">{isSignup ? "Create account" : "Login"}</h1>
        {isSignup && (
          <input className={input} placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        )}
        <input className={input} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className={input} type="password" placeholder="Password (min 6 characters)" value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button disabled={loading} className="w-full rounded-lg bg-primary py-3 text-white disabled:opacity-60">
          {loading ? "Please wait..." : isSignup ? "Sign up" : "Login"}
        </button>
        <p className="text-center text-sm text-gray-600">
          {isSignup ? "Already have an account? " : "New here? "}
          <Link to={isSignup ? "/login" : "/signup"} className="text-primary">
            {isSignup ? "Login" : "Sign up"}
          </Link>
        </p>
      </form>
    </div>
  );
}