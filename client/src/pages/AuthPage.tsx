import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { api } from "../api";
import SplitPage from "../components/SplitPage";

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
      setError(axios.isAxiosError(err) ? err.response?.data?.error ?? "Cannot reach the server" : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SplitPage
      title={isSignup ? "Create your account" : "Welcome back"}
      subtitle={isSignup ? "Takes less than a minute." : "Login to see your house."}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900">{isSignup ? "Sign up" : "Login"}</h2>

        {isSignup && (
          <label className="label">
            Name
            <input className="field mt-1" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
          </label>
        )}
        <label className="label">
          Email
          <input className="field mt-1" type="email" placeholder="you@gmail.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="label">
          Password
          <input className="field mt-1" type="password" placeholder="At least 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>

        {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        <button disabled={loading} className="btn-primary">
          {loading ? "Please wait..." : isSignup ? "Sign up" : "Login"}
        </button>

        <p className="text-center text-sm text-slate-500">
          {isSignup ? "Already have an account? " : "New here? "}
          <Link to={isSignup ? "/login" : "/signup"} className="font-semibold text-brand">
            {isSignup ? "Login" : "Sign up"}
          </Link>
        </p>
      </form>
    </SplitPage>
  );
}