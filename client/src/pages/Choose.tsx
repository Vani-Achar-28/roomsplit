import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";

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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-6 text-center">
      <h1 className="text-2xl font-bold text-primary">Hi {user.name}!</h1>

      {loading && <p className="mt-6 text-sm text-gray-500">Loading your houses...</p>}

      {error && (
        <div className="mt-6 space-y-2">
          <p className="text-sm text-red-600">{error}</p>
          <button onClick={load} className="rounded-lg bg-primary px-4 py-2 text-sm text-white">
            Try again
          </button>
        </div>
      )}

      {!loading && houses.length > 0 && (
        <div className="mt-6 w-full max-w-xs space-y-2">
          <p className="text-sm text-gray-600">Your houses</p>
          {houses.map((h) => (
            <Link
              key={h.id}
              to={`/house/${h.id}`}
              className="block rounded-lg border border-gray-300 bg-white px-4 py-3 text-left"
            >
              {h.name} <span className="text-xs text-gray-500">({h.role})</span>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-6 flex w-full max-w-xs flex-col gap-3">
        <Link to="/create-house" className="rounded-lg bg-primary py-3 text-white">
          Create a house
        </Link>
        <Link to="/join-house" className="rounded-lg border border-primary py-3 text-primary">
          Join a house
        </Link>
      </div>

      <button onClick={logout} className="mt-8 text-sm text-gray-500 underline">
        Logout
      </button>
    </div>
  );
}