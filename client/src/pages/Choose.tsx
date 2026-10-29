import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import SplitPage from "../components/SplitPage";

type House = { id: number; name: string; role: string };

export default function Choose() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const [houses, setHouses] = useState<House[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  function load() {
    setLoading(true);
    setError("");
    api
      .get("/houses/mine")
      .then((res) => setHouses(res.data))
      .catch(() => setError("Could not load your houses. The server may be waking up."))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  function logout() {
    localStorage.clear();
    navigate("/");
  }

  return (
    <SplitPage title={`Hi ${user.name || "there"}`} subtitle="Open one of your houses, or start a new one.">
      <div className="space-y-6">
        <section>
          <h2 className="font-semibold text-slate-900">Your houses</h2>
          {loading && <p className="mt-3 text-sm text-slate-500">Loading...</p>}
          {error && (
            <div className="mt-3 space-y-2">
              <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
              <button onClick={load} className="btn-primary">Try again</button>
            </div>
          )}
          {!loading && !error && houses.length === 0 && (
            <p className="mt-3 rounded-xl bg-white p-4 text-sm text-slate-500 ring-1 ring-slate-200">
              You are not in any house yet. Create one or join with an invite code.
            </p>
          )}
          <ul className="mt-3 space-y-2">
            {houses.map((h) => (
              <li key={h.id}>
                <Link to={`/house/${h.id}`} className="flex items-center gap-3 rounded-xl bg-white p-4 ring-1 ring-slate-200 transition hover:ring-brand">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-soft font-bold text-brand">
                    {h.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-slate-900">{h.name}</span>
                    <span className="text-xs text-slate-500">{h.role === "ADMIN" ? "You are the admin" : "Member"}</span>
                  </span>
                  <span className="text-slate-400">›</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <div className="space-y-3">
          <Link to="/create-house" className="btn-primary block">Create a house</Link>
          <Link to="/join-house" className="btn-outline block">Join with invite code</Link>
        </div>

        <button onClick={logout} className="text-sm font-medium text-slate-500 underline">
          Logout
        </button>
      </div>
    </SplitPage>
  );
}