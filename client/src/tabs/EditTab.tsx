import { useEffect, useState, type FormEvent } from "react";
import axios from "axios";
import { api } from "../api";
import type { HouseData } from "../types";
import Section from "../components/Section";
import { inr } from "../utils";

type Assignment = { id: number; choreId: number; chore: { title: string } };
type Bill = {
  id: number;
  title: string;
  category: string;
  amount: number;
  splitType: string;
  isRecurring: boolean;
  recurringDay: number | null;
  date: string;
  paidBy: { name: string };
  splits: { id: number; isPaid: boolean }[];
};

type Part = "bills" | "chores" | "invite";

export default function EditTab({ house }: { house: HouseData }) {
  const [part, setPart] = useState<Part>("bills");

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Rent");
  const [amount, setAmount] = useState("");
  const [billMsg, setBillMsg] = useState("");
  const [bills, setBills] = useState<Bill[]>([]);

  const [byDays, setByDays] = useState(false);
  const [days, setDays] = useState<Record<number, string>>({});

  const [repeat, setRepeat] = useState(false);
  const [repeatDay, setRepeatDay] = useState("1");

  const [choreTitle, setChoreTitle] = useState("");
  const [chores, setChores] = useState<Assignment[]>([]);
  const [choreMsg, setChoreMsg] = useState("");
  const [copied, setCopied] = useState(false);

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
      const body: Record<string, unknown> = { title, category, amountRupees: Number(amount) };
      if (byDays) {
        body.daysPresent = house.members.map((m) => ({ userId: m.user.id, days: Number(days[m.user.id] ?? 0) }));
      }
      if (repeat) {
        const d = Number(repeatDay);
        if (!Number.isInteger(d) || d < 1 || d > 28) {
          setBillMsg("Repeat day must be between 1 and 28");
          return;
        }
        body.isRecurring = true;
        body.recurringDay = d;
      }
      await api.post(`/houses/${house.id}/expenses`, body);
      setBillMsg(
        repeat
          ? `Bill added. It repeats on day ${repeatDay} of every month.`
          : byDays
          ? "Bill added and split by days present."
          : `Bill added and split among ${house.members.length} flatmates.`
      );
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

  function copyCode() {
    navigator.clipboard?.writeText(house.inviteCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const whatsapp = `https://wa.me/?text=${encodeURIComponent(
    `Join our house "${house.name}" on RoomSplit. Use invite code: ${house.inviteCode}`
  )}`;

  const parts: { key: Part; label: string }[] = [
    { key: "bills", label: "Bills" },
    { key: "chores", label: "Chores" },
    { key: "invite", label: "Invite" },
  ];

  const checkRow = "flex items-start gap-3 rounded-xl border border-slate-200 p-3 text-sm text-slate-700";

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">Manage house</h1>
          <p className="text-sm text-slate-500">Bills, chores and invites. Only the admin can see this.</p>
        </div>
        <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-200/70 p-1 md:w-80">
          {parts.map((p) => (
            <button
              key={p.key}
              onClick={() => setPart(p.key)}
              className={`rounded-lg py-2 text-sm font-medium transition ${part === p.key ? "bg-white text-brand shadow-sm" : "text-slate-600"}`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {part === "bills" && (
        <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
          <Section title="Add a bill" hint="Rent, electricity, WiFi... split among all flatmates.">
            <form onSubmit={addBill} className="space-y-3">
              <label className="label">
                Bill name
                <input className="field mt-1" placeholder="e.g. WiFi bill" value={title} onChange={(e) => setTitle(e.target.value)} />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="label">
                  Type
                  <select className="field mt-1" value={category} onChange={(e) => setCategory(e.target.value)}>
                    <option>Rent</option>
                    <option>Electricity</option>
                    <option>WiFi</option>
                    <option>Gas</option>
                    <option>Water</option>
                    <option>Other</option>
                  </select>
                </label>
                <label className="label">
                  Amount (₹)
                  <input className="field mt-1" type="number" placeholder="0" value={amount} onChange={(e) => setAmount(e.target.value)} />
                </label>
              </div>

              <label className={checkRow}>
                <input type="checkbox" className="mt-1" checked={byDays} disabled={repeat} onChange={(e) => toggleByDays(e.target.checked)} />
                <span>
                  <b className="text-slate-900">Split by days present</b>
                  <br />
                  <span className="text-xs text-slate-500">Someone away for 10 days pays less.</span>
                </span>
              </label>

              {byDays && (
                <div className="space-y-2 rounded-xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Days each person stayed this month</p>
                  {house.members.map((m) => (
                    <div key={m.id} className="flex items-center justify-between gap-3">
                      <span className="text-sm text-slate-700">{m.user.name}</span>
                      <input
                        type="number"
                        min={0}
                        max={31}
                        className="field w-24 py-2"
                        value={days[m.user.id] ?? ""}
                        onChange={(e) => setDays({ ...days, [m.user.id]: e.target.value })}
                      />
                    </div>
                  ))}
                </div>
              )}

              <label className={checkRow}>
                <input type="checkbox" className="mt-1" checked={repeat} disabled={byDays} onChange={(e) => setRepeat(e.target.checked)} />
                <span>
                  <b className="text-slate-900">Repeat every month</b>
                  <br />
                  <span className="text-xs text-slate-500">Good for rent and WiFi. Created automatically.</span>
                </span>
              </label>

              {repeat && (
                <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-3">
                  <span className="text-sm text-slate-700">Create on day (1-28)</span>
                  <input type="number" min={1} max={28} className="field w-24 py-2" value={repeatDay} onChange={(e) => setRepeatDay(e.target.value)} />
                </div>
              )}

              <button className="btn-primary">Add and split</button>
              {billMsg && <p className="rounded-xl bg-brand-soft px-3 py-2 text-sm text-brand">{billMsg}</p>}
            </form>
          </Section>

          <Section title={`All bills (${bills.length})`} hint="Past bills and how many people have paid.">
            {bills.length === 0 ? (
              <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500">No bills yet.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {bills.map((b) => {
                  const paid = b.splits.filter((s) => s.isPaid).length;
                  return (
                    <li key={b.id} className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-slate-900">{b.title}</p>
                        <p className="text-sm text-slate-500">
                          {inr(b.amount / 100)} · {b.category} · paid by {b.paidBy.name}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                          <span>{new Date(b.date).toLocaleDateString("en-IN")}</span>
                          <span className="rounded-full bg-slate-100 px-2 py-0.5">{paid}/{b.splits.length} paid</span>
                          {b.splitType === "CUSTOM" && <span className="rounded-full bg-slate-100 px-2 py-0.5">by days</span>}
                          {b.isRecurring && <span className="rounded-full bg-slate-100 px-2 py-0.5">repeats day {b.recurringDay}</span>}
                        </div>
                      </div>
                      <button onClick={() => deleteBill(b.id)} className="shrink-0 text-sm font-semibold text-red-600">
                        Delete
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </Section>
        </div>
      )}

      {part === "chores" && (
        <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
          <Section title="Add a chore" hint="It rotates between flatmates every day.">
            <form onSubmit={addChore} className="flex gap-2">
              <input className="field" placeholder="e.g. Cook dinner" value={choreTitle} onChange={(e) => setChoreTitle(e.target.value)} />
              <button className="shrink-0 rounded-xl bg-brand px-5 text-sm font-semibold text-white hover:bg-brand-dark">Add</button>
            </form>
            {choreMsg && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{choreMsg}</p>}
          </Section>

          <Section title={`All chores (${chores.length})`} hint="Delete a chore to stop it rotating.">
            {chores.length === 0 ? (
              <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500">No chores yet.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {chores.map((a) => (
                  <li key={a.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                    <span className="font-medium text-slate-900">{a.chore.title}</span>
                    <button onClick={() => deleteChore(a.choreId)} className="text-sm font-semibold text-red-600">
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>
      )}

      {part === "invite" && (
        <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
          <Section title="Invite flatmates" hint="Share this code with them.">
            <div className="rounded-xl bg-brand-soft py-8 text-center">
              <p className="text-sm text-slate-600">Invite code</p>
              <p className="mt-1 font-mono text-4xl font-bold tracking-widest text-brand">{house.inviteCode}</p>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button onClick={copyCode} className="btn-primary">{copied ? "Copied!" : "Copy code"}</button>
              <a href={whatsapp} target="_blank" rel="noreferrer" className="btn-outline block">
                WhatsApp
              </a>
            </div>
          </Section>

          <Section title="How do flatmates join?">
            <ol className="space-y-3 text-sm text-slate-700">
              <li><b className="text-slate-900">1.</b> They create an account on RoomSplit.</li>
              <li><b className="text-slate-900">2.</b> They tap "Join with invite code".</li>
              <li><b className="text-slate-900">3.</b> They enter the code and they are in.</li>
            </ol>
          </Section>
        </div>
      )}
    </div>
  );
}