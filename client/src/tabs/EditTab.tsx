import { useEffect, useState, type FormEvent } from "react";
import axios from "axios";
import { api } from "../api";
import type { HouseData } from "../types";

type Assignment = { id: number; choreId: number; chore: { title: string } };

export default function EditTab({ house }: { house: HouseData }) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Rent");
  const [amount, setAmount] = useState("");
  const [billMsg, setBillMsg] = useState("");

  const [choreTitle, setChoreTitle] = useState("");
  const [chores, setChores] = useState<Assignment[]>([]);
  const [choreMsg, setChoreMsg] = useState("");

  function loadChores() {
    api.get(`/houses/${house.id}/chores/today`).then((r) => setChores(r.data));
  }

  useEffect(() => {
    loadChores();
  }, [house.id]);

  async function addBill(e: FormEvent) {
    e.preventDefault();
    setBillMsg("");
    try {
      await api.post(`/houses/${house.id}/expenses`, {
        title,
        category,
        amountRupees: Number(amount),
      });
      setBillMsg(`Bill added and split among ${house.members.length} members`);
      setTitle("");
      setAmount("");
    } catch (err) {
      setBillMsg(axios.isAxiosError(err) ? err.response?.data?.error ?? "Failed" : "Failed");
    }
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
          <button className="w-full rounded-lg bg-primary py-3 text-white">Add and split</button>
          {billMsg && <p className="text-sm text-gray-700">{billMsg}</p>}
        </form>
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