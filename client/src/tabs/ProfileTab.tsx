import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { api } from "../api";
import type { HouseData } from "../types";

export default function ProfileTab({ house }: { house: HouseData }) {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = house.myRole === "ADMIN";
  const [upiId, setUpiId] = useState("");
  const [msg, setMsg] = useState("");
  const [houseMsg, setHouseMsg] = useState("");

  useEffect(() => {
    api.get("/profile").then((r) => setUpiId(r.data.upiId));
  }, []);

  function errorText(err: unknown) {
    return axios.isAxiosError(err) ? err.response?.data?.error ?? "Failed" : "Failed";
  }

  async function saveUpi(e: FormEvent) {
    e.preventDefault();
    setMsg("");
    try {
      await api.patch("/profile/upi", { upiId });
      setMsg("UPI id saved");
    } catch (err) {
      setMsg(errorText(err));
    }
  }

  async function leaveHouse() {
    if (!window.confirm("Leave this house?")) return;
    setHouseMsg("");
    try {
      await api.post(`/houses/${house.id}/leave`);
      navigate("/choose");
    } catch (err) {
      setHouseMsg(errorText(err));
    }
  }

  async function removeMember(userId: number, name: string) {
    if (!window.confirm(`Remove ${name} from the house?`)) return;
    setHouseMsg("");
    try {
      await api.delete(`/houses/${house.id}/members/${userId}`);
      window.location.reload();
    } catch (err) {
      setHouseMsg(errorText(err));
    }
  }

  async function deleteHouse() {
    if (!window.confirm("Delete this house and ALL its bills and chores? This cannot be undone.")) return;
    setHouseMsg("");
    try {
      await api.delete(`/houses/${house.id}`);
      navigate("/choose");
    } catch (err) {
      setHouseMsg(errorText(err));
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

      {isAdmin && (
        <section>
          <h2 className="font-semibold">Manage members</h2>
          <ul className="mt-2 space-y-1">
            {house.members.map((m) => (
              <li key={m.id} className="flex items-center justify-between rounded-lg bg-white px-4 py-2">
                <span>
                  {m.user.name} <span className="text-xs text-gray-500">({m.role})</span>
                </span>
                {m.user.id !== user.id && (
                  <button onClick={() => removeMember(m.user.id, m.user.name)} className="text-sm text-red-600">
                    Remove
                  </button>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {houseMsg && <p className="text-sm text-red-600">{houseMsg}</p>}

      <button onClick={() => navigate("/choose")} className="w-full rounded-lg border border-primary py-3 text-primary">
        Switch house
      </button>

      {isAdmin ? (
        <button onClick={deleteHouse} className="w-full rounded-lg border border-red-600 py-3 text-red-600">
          Delete house
        </button>
      ) : (
        <button onClick={leaveHouse} className="w-full rounded-lg border border-red-600 py-3 text-red-600">
          Leave house
        </button>
      )}

      <button onClick={logout} className="w-full rounded-lg bg-primary py-3 text-white">
        Logout
      </button>
    </div>
  );
}