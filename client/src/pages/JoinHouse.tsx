import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { api } from "../api";
import SplitPage from "../components/SplitPage";

export default function JoinHouse() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const res = await api.post("/houses/join", { inviteCode: code });
      navigate(`/house/${res.data.houseId}`);
    } catch (err) {
      setError(axios.isAxiosError(err) ? err.response?.data?.error ?? "Failed" : "Failed");
    }
  }

  return (
    <SplitPage title="Join a house" subtitle="Ask your admin for the 6-letter invite code.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="label">
          Invite code
          <input
            className="field mt-1 text-center font-mono text-2xl uppercase tracking-widest"
            placeholder="A1B2C3"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
        </label>
        {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
        <button className="btn-primary">Join house</button>
        <button type="button" onClick={() => navigate("/choose")} className="w-full text-sm font-medium text-slate-500">
          Back
        </button>
      </form>
    </SplitPage>
  );
}