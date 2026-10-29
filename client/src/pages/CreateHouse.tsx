import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { api } from "../api";
import SplitPage from "../components/SplitPage";

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
    <SplitPage title="Create a house" subtitle="You become the admin and get an invite code for your flatmates.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="label">
          House name
          <input className="field mt-1" placeholder="e.g. Sunrise PG" value={name} onChange={(e) => setName(e.target.value)} />
        </label>

        <div>
          <p className="label">Type</p>
          <div className="mt-1 grid grid-cols-2 gap-3">
            {(["FLAT", "PG"] as const).map((t) => (
              <button
                type="button"
                key={t}
                onClick={() => setType(t)}
                className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                  type === t ? "border-brand bg-brand-soft text-brand" : "border-slate-300 bg-white text-slate-600"
                }`}
              >
                {t === "FLAT" ? "Flat" : "PG"}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        <button disabled={loading} className="btn-primary">{loading ? "Creating..." : "Create house"}</button>
        <button type="button" onClick={() => navigate("/choose")} className="w-full text-sm font-medium text-slate-500">
          Back
        </button>
      </form>
    </SplitPage>
  );
}