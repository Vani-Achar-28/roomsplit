import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { api } from "../api";

export default function CreateHouse() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [type, setType] = useState<"PG" | "FLAT">("FLAT");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/houses", { name, type });
      navigate(`/house/${res.data.id}`);
    } catch (err) {
      setError(axios.isAxiosError(err) ? err.response?.data?.error ?? "Failed" : "Failed");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-6">
      <form onSubmit={handleSubmit} className="w-full max-w-xs space-y-3">
        <h1 className="text-2xl font-bold text-primary">Create a house</h1>
        <input
          className="w-full rounded-lg border border-gray-300 px-4 py-3"
          placeholder="House name (e.g. Sunrise PG)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <select
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3"
          value={type}
          onChange={(e) => setType(e.target.value as "PG" | "FLAT")}
        >
          <option value="FLAT">Flat</option>
          <option value="PG">PG</option>
        </select>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          disabled={loading}
          className="w-full rounded-lg bg-primary py-3 text-white disabled:opacity-60"
        >
          {loading ? "Creating..." : "Create"}
        </button>
        <button type="button" onClick={() => navigate("/choose")} className="w-full text-sm text-gray-500">
          Back
        </button>
      </form>
    </div>
  );
}