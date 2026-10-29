import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { api } from "../api";
import type { HouseData } from "../types";
import Section from "../components/Section";

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
      setMsg("UPI id saved.");
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
    <div className="space-y-5">
      <div className="card flex items-center gap-4">
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-brand text-2xl font-bold text-white">
          {(user.name || "?").charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold text-slate-900">{user.name}</h1>
          <p className="truncate text-sm text-slate-500">{user.email}</p>
          <p className="mt-1 text-sm text-slate-500">
            {house.name} · <span className="rounded-full bg-brand-soft px-2 py-0.5 text-xs font-semibold text-brand">{isAdmin ? "Admin" : "Member"}</span>
          </p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
        <div className="space-y-5">
          <Section title="My UPI id" hint="Flatmates use this to pay you.">
            <form onSubmit={saveUpi} className="space-y-3">
              <input className="field" placeholder="yourname@upi" value={upiId} onChange={(e) => setUpiId(e.target.value)} />
              <button className="btn-primary">Save UPI id</button>
              {msg && <p className="rounded-xl bg-brand-soft px-3 py-2 text-sm text-brand">{msg}</p>}
            </form>
          </Section>

          <Section title="Account">
            <div className="grid gap-3 sm:grid-cols-2">
              <button onClick={() => navigate("/choose")} className="btn-outline">Switch house</button>
              <button onClick={logout} className="btn-outline">Logout</button>
            </div>
          </Section>
        </div>

        <div className="space-y-5">
          {isAdmin && (
            <Section title="Members" hint="You can remove a flatmate once they have no pending payments.">
              <ul className="divide-y divide-slate-100">
                {house.members.map((m) => (
                  <li key={m.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-soft text-sm font-bold text-brand">
                      {m.user.name.charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-slate-900">{m.user.name}</p>
                      <p className="text-xs text-slate-500">{m.role === "ADMIN" ? "Admin" : "Member"}</p>
                    </div>
                    {m.user.id !== user.id && (
                      <button onClick={() => removeMember(m.user.id, m.user.name)} className="text-sm font-semibold text-red-600">
                        Remove
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {houseMsg && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{houseMsg}</p>}

          <Section
            title={isAdmin ? "Delete house" : "Leave house"}
            hint={isAdmin ? "This removes all bills and chores for everyone." : "You can leave once all your payments are settled."}
          >
            {isAdmin ? (
              <button onClick={deleteHouse} className="btn-danger">Delete house</button>
            ) : (
              <button onClick={leaveHouse} className="btn-danger">Leave house</button>
            )}
          </Section>
        </div>
      </div>
    </div>
  );
}