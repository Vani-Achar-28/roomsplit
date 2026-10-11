import { useEffect, useState, type FormEvent } from "react";
import axios from "axios";
import { api } from "../api";
import type { HouseData } from "../types";

type Assignment = { id: number; choreId: number; chore: { title: string } };
type Bill = {
  id: number;
  title: string;
  category: string;
  amount: number;
  splitType: string;
  date: string;
  paidBy: { name: string };
  splits: { id: number; isPaid: boolean }[];
};

export default function EditTab({ house }: { house: HouseData }) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Rent");
  const [amount, setAmount] = useState("");
  const [billMsg, setBillMsg] = useState("");
  const [bills, setBills] = useState<Bill[]>([]);

  const [byDays, setByDays] = useState(false);
  const [days, setDays] = useState<Record<number, string>>({});

  const [choreTitle, setChoreTitle] = useState("");
  const [chores, setChores] = useState<Assignment[]>([]);
  const [choreMsg, setChoreMsg] = useState("");

  function loadChores() {
    api.get(`/houses/${house.id}/chores/today`).then((r) => setChores(r.data));
  }

  function loadBills() {
    api.get(`/houses/${house.id}/expenses`).then((r) => setBills(r.data));
  }

  useEffect(() => {
    loadChores();
    loadBills();
  }, [house.id]);

  function toggleByDays(on: boolean) {
    setByDays(on);
    if (on) {
      const start: Record<number, string> = {};
      house.members.forEach((m) => (start[m.user.id] = "30"));
      setDays(start);
    }
  }

  async function addBill(e: FormEvent) {
    e.preventDefault();
    setBillMsg("");
    try {
      const body: Record<string, unknown> = {
        title,
        category,
        amountRupees: Number(amount),
      };
      if (byDays) {
        body.daysPresent = house.members.map((m) => ({
          userId: m.user.id,
          days: Number(days[m.user.id] ?? 0),
        }));
      }
      await api.post(`/houses/${house.id}/expenses`, body);
      setBillMsg(byDays ? "Bill added and split by days present" : `Bill added and split among ${house.members.length} members`);
      setTitle("");
      setAmount("");
      loadBills();
    } catch (err) {
      setBillMsg(axios.isAxiosError(err) ? err.response?.data?.error ?? "Failed" : "Failed");
    }
  }

  async function deleteBill(id: number) {
    if (!window.confirm("Delete this bill? Everyone's share will be removed.")) return;
    await api.delete(`/houses/${house.id}/expenses/${id}`);
    loadBills();
  }

  async function addChore(e: FormEvent) {
    e.preventDefault();
    setChoreMsg("");
    try {
      await api.post(`/houses/${house.id}/chores`, { title: choreTitle });
      setChoreTitle("");
      loadChores();
    } catch (err) {
      setChoreMsg(axios.isAxiosError(err) ? err.response?.data?.error ?? "Failed" : "Failed");
    }
  }

  async function deleteChore(choreId: number) {
    await api.delete(`/houses/${house.id}/chores/${choreId}`);
    loadChores();
  }

  const input = "w-full rounded-lg border border-gray-300 bg-white px-4 py-3";

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-primary">Edit</h1>

      <section>
        <h2 className="font-semibold">Invite flatmates</h2>
        <p className="mt-1 text-sm text-gray-600">
          Share this code: <span className="font-mono font-bold">{house.inviteCode}</span>
        </p>
      </section>

      <section>
        <h2 className="font-semibold">Add a bill</h2>
        <form onSubmit={addBill} className="mt-2 space-y-2">
          <input className={input} placeholder="Title (e.g. WiFi bill)" value={title} onChange={(e) => setTitle(e.target.value)} />
          <select className={input} value={category} onChange={(e) => setCategory(e.target.value)}>
            <option>Rent</option>
            <option>Electricity</option>
            <option>WiFi</option>
            <option>Gas</option>
            <option>Water</option>
            <option>Other</option>
          </select>
          <input className={input} type="number" placeholder="Amount in rupees" value={amount} onChange={(e) => setAmount(e.target.value)} />

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={byDays} onChange={(e) => toggleByDays(e.target.checked)} />
            Split by days present (instead of equally)
          </label>

          {byDays && (
            <div className="space-y-2 rounded-lg bg-white p-3">
              <p className="text-xs text-gray-500">Days each person stayed this month</p>
              {house.members.map((m) => (
                <div key={m.id} className="flex items-center justify-between gap-3">
                  <span>{m.user.name}</span>
                  <input
                    type="number"
                    min={0}
                    max={31}
                    className="w-24 rounded-lg border border-gray-300 px-3 py-2"
                    value={days[m.user.id] ?? ""}
                    onChange={(e) => setDays({ ...days, [m.user.id]: e.target.value })}
                  />
                </div>
              ))}
            </div>
          )}

          <button className="w-full rounded-lg bg-primary py-3 text-white">Add and split</button>
          {billMsg && <p className="text-sm text-gray-700">{billMsg}</p>}
        </form>
      </section>

      <section>
        <h2 className="font-semibold">Bills ({bills.length})</h2>
        {bills.length === 0 ? (
          <p className="mt-2 text-sm text-gray-500">No bills yet.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {bills.map((b) => {
              const paid = b.splits.filter((s) => s.isPaid).length;
              return (
                <li key={b.id} className="flex items-center justify-between rounded-lg bg-white px-4 py-3">
                  <div>
                    <p>
                      {b.title} <span className="text-xs text-gray-500">({b.category})</span>
                      {b.splitType === "CUSTOM" && (
                        <span className="ml-1 rounded bg-gray-100 px-1 text-xs text-gray-600">by days</span>
                      )}
                    </p>
                    <p className="text-sm text-gray-600">
                      Rs {(b.amount / 100).toFixed(2)} - paid by {b.paidBy.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(b.date).toLocaleDateString("en-IN")} - {paid}/{b.splits.length} paid
                    </p>
                  </div>
                  <button onClick={() => deleteBill(b.id)} className="text-sm text-red-600">
                    Delete
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section>
        <h2 className="font-semibold">Chores</h2>
        <form onSubmit={addChore} className="mt-2 flex gap-2">
          <input className={input} placeholder="New chore (e.g. Cook dinner)" value={choreTitle} onChange={(e) => setChoreTitle(e.target.value)} />
          <button className="rounded-lg bg-primary px-4 text-white">Add</button>
        </form>
        {choreMsg && <p className="mt-1 text-sm text-red-600">{choreMsg}</p>}
        <ul className="mt-3 space-y-1">
          {chores.map((a) => (
            <li key={a.id} className="flex items-center justify-between rounded-lg bg-white px-4 py-2">
              {a.chore.title}
              <button onClick={() => deleteChore(a.choreId)} className="text-sm text-red-600">
                Delete
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}