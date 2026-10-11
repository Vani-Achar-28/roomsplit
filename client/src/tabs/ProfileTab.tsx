import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { api } from "../api";
import type { HouseData } from "../types";

export default function ProfileTab({ house }: { house: HouseData }) {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const [upiId, setUpiId] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    api.get("/profile").then((r) => setUpiId(r.data.upiId));
  }, []);

  async function saveUpi(e: FormEvent) {
    e.preventDefault();
    setMsg("");
    try {
      await api.patch("/profile/upi", { upiId });
      setMsg("UPI id saved");
    } catch (err) {
      setMsg(axios.isAxiosError(err) ? err.response?.data?.error ?? "Failed" : "Failed");
    }
  }

  function logout() {
    localStorage.clear();
    navigate("/");
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-primary">Profile</h1>
      <div className="space-y-1 rounded-lg bg-white p-4">
        <p><span className="text-gray-500">Name:</span> {user.name}</p>
        <p><span className="text-gray-500">Email:</span> {user.email}</p>
        <p><span className="text-gray-500">House:</span> {house.name}</p>
        <p><span className="text-gray-500">Role:</span> {house.myRole}</p>
      </div>

      <form onSubmit={saveUpi} className="space-y-2">
        <h2 className="font-semibold">My UPI id</h2>
        <input
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3"
          placeholder="yourname@upi"
          value={upiId}
          onChange={(e) => setUpiId(e.target.value)}
        />
        <button className="w-full rounded-lg bg-primary py-3 text-white">Save UPI id</button>
        {msg && <p className="text-sm text-gray-700">{msg}</p>}
      </form>

      <button onClick={() => navigate("/choose")} className="w-full rounded-lg border border-primary py-3 text-primary">
        Switch house
      </button>
      <button onClick={logout} className="w-full rounded-lg bg-primary py-3 text-white">
        Logout
      </button>
    </div>
  );
}