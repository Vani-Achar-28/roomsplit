import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { api } from "../api";

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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-6">
      <form onSubmit={handleSubmit} className="w-full max-w-xs space-y-3">
        <h1 className="text-2xl font-bold text-primary">Join a house</h1>
        <input
          className="w-full rounded-lg border border-gray-300 px-4 py-3 uppercase"
          placeholder="Invite code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="w-full rounded-lg bg-primary py-3 text-white">Join</button>
        <button type="button" onClick={() => navigate("/choose")} className="w-full text-sm text-gray-500">
          Back
        </button>
      </form>
    </div>
  );
}
