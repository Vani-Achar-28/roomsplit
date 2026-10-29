import { useEffect, useState, type FormEvent } from "react";
import axios from "axios";
import { api } from "../api";
import type { HouseData } from "../types";
import Section from "../components/Section";
import { inr } from "../utils";

type Assignment = {
  id: number;
  done: boolean;
  chore: { title: string };
  user: { id: number; name: string };
};

type Dues = {
  totalRupees: number;
  dues: {
    id: number;
    share: number;
    expense: { title: string; paidBy: { name: string; upiId: string | null } };
  }[];
};

type Collect = {
  totalRupees: number;
  items: { id: number; share: number; user: { name: string }; expense: { title: string } }[];
};

type Transfer = {
  from: { id: number; name: string };
  to: { id: number; name: string; upiId: string | null };
  amountRupees: number;
};

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

function Avatar({ name }: { name: string }) {
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-soft text-sm font-bold text-brand">
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500">{text}</p>;
}

export default function HomeTab({ house }: { house: HouseData }) {
  const me = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = house.myRole === "ADMIN";
  const [chores, setChores] = useState<Assignment[]>([]);
  const [dues, setDues] = useState<Dues | null>(null);
  const [collect, setCollect] = useState<Collect | null>(null);
  const [plan, setPlan] = useState<Transfer[]>([]);

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Groceries");
  const [amount, setAmount] = useState("");
  const [expMsg, setExpMsg] = useState("");
  const [saving, setSaving] = useState(false);

  function load() {
    api.get(`/houses/${house.id}/chores/today`).then((r) => setChores(r.data));
    api.get(`/houses/${house.id}/my-dues`).then((r) => setDues(r.data));
    api.get(`/houses/${house.id}/to-collect`).then((r) => setCollect(r.data));
    api.get(`/houses/${house.id}/summary`).then((r) => setPlan(r.data));
  }

  useEffect(() => {
    load();
  }, [house.id]);

  function markDone(id: number) {
    api.patch(`/houses/${house.id}/chores/assignments/${id}/done`).then(load);
  }

  function markReceived(splitId: number) {
    api.patch(`/houses/${house.id}/splits/${splitId}/paid`).then(load);
  }

  async function addExpense(e: FormEvent) {
    e.preventDefault();
    if (saving) return;
    setExpMsg("");
    setSaving(true);
    try {
      await api.post(`/houses/${house.id}/expenses`, { title, category, amountRupees: Number(amount) });
      setExpMsg(`Added and split equally among ${house.members.length} flatmates.`);
      setTitle("");
      setAmount("");
      load();
    } catch (err) {
      setExpMsg(axios.isAxiosError(err) ? err.response?.data?.error ?? "Failed" : "Failed");
    } finally {
      setSaving(false);
    }
  }

  function upiLink(upiId: string, name: string, rupees: number, note: string) {
    return `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(name)}&am=${rupees.toFixed(2)}&cu=INR&tn=${encodeURIComponent(note)}`;
  }

  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });
  const owe = dues ? dues.totalRupees : 0;
  const get = collect ? collect.totalRupees : 0;

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">{today}</p>
          <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">
            {greeting()}, {me.name}
          </h1>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="shrink-0 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark"
        >
          {showForm ? "Close" : "+ Add expense"}
        </button>
      </div>

      {showForm && (
        <Section title="Add an expense I paid" hint="Groceries, gas, milk... it is split equally among everyone.">
          <form onSubmit={addExpense} className="grid gap-3 md:grid-cols-3">
            <label className="label md:col-span-3">
              What did you buy?
              <input className="field mt-1" placeholder="e.g. Vegetables" value={title} onChange={(e) => setTitle(e.target.value)} />
            </label>
            <label className="label">
              Type
              <select className="field mt-1" value={category} onChange={(e) => setCategory(e.target.value)}>
                <option>Groceries</option>
                <option>Gas</option>
                <option>Milk</option>
                <option>Cleaning</option>
                <option>Household</option>
                <option>Other</option>
              </select>
            </label>
            <label className="label">
              Amount (₹)
              <input className="field mt-1" type="number" placeholder="0" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </label>
            <div className="flex items-end">
              <button disabled={saving} className="btn-primary">{saving ? "Adding..." : "Add and split"}</button>
            </div>
            {expMsg && <p className="rounded-xl bg-brand-soft px-3 py-2 text-sm text-brand md:col-span-3">{expMsg}</p>}
          </form>
        </Section>
      )}

      {/* Summary */}
      <div className="card grid grid-cols-2 divide-x divide-slate-200 p-0">
        <div className="p-5">
          <p className="text-sm text-slate-500">You owe</p>
          <p className="mt-1 text-2xl font-bold text-red-600 md:text-3xl">{inr(owe)}</p>
        </div>
        <div className="p-5">
          <p className="text-sm text-slate-500">You are owed</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600 md:text-3xl">{inr(get)}</p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3 lg:items-start">
        <div className="space-y-5 lg:col-span-2">
          <Section title="Money you owe" hint="Pay your flatmates. The UPI button opens GPay or PhonePe.">
            {!dues || dues.dues.length === 0 ? (
              <Empty text="You do not owe anything right now." />
            ) : (
              <ul className="divide-y divide-slate-100">
                {dues.dues.map((d) => {
                  const rupees = d.share / 100;
                  const upi = d.expense.paidBy.upiId;
                  return (
                    <li key={d.id} className="py-3 first:pt-0 last:pb-0">
                      <div className="flex items-center gap-3">
                        <Avatar name={d.expense.paidBy.name} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-slate-900">{d.expense.title}</p>
                          <p className="text-sm text-slate-500">To {d.expense.paidBy.name}</p>
                        </div>
                        <p className="shrink-0 font-semibold text-red-600">{inr(rupees)}</p>
                      </div>
                      {upi ? (
                        <a href={upiLink(upi, d.expense.paidBy.name, rupees, d.expense.title)} className="btn-primary mt-3 block">
                          Pay via UPI
                        </a>
                      ) : (
                        <p className="mt-2 text-xs text-slate-500">{d.expense.paidBy.name} has not added a UPI id yet.</p>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </Section>

          <Section title="Money you will get" hint="After a flatmate pays you, tap Received.">
            {!collect || collect.items.length === 0 ? (
              <Empty text="Nobody owes you right now." />
            ) : (
              <ul className="divide-y divide-slate-100">
                {collect.items.map((c) => (
                  <li key={c.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <Avatar name={c.user.name} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-slate-900">{c.user.name}</p>
                      <p className="truncate text-sm text-slate-500">{c.expense.title}</p>
                    </div>
                    <p className="shrink-0 font-semibold text-emerald-600">{inr(c.share / 100)}</p>
                    <button onClick={() => markReceived(c.id)} className="shrink-0 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                      Received
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="Settle-up plan" hint="The fewest payments needed so that everyone is even.">
            {plan.length === 0 ? (
              <Empty text="Everyone is settled up." />
            ) : (
              <ul className="divide-y divide-slate-100">
                {plan.map((t, i) => (
                  <li key={i} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                    <span className="text-slate-700">
                      <span className="font-semibold text-slate-900">{t.from.name}</span> pays{" "}
                      <span className="font-semibold text-slate-900">{t.to.name}</span>
                    </span>
                    <span className="shrink-0 font-semibold text-slate-900">{inr(t.amountRupees)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>

        <div className="space-y-5">
          <Section title="Today's chores" hint="Rotates between flatmates every day.">
            {chores.length === 0 ? (
              <Empty text={isAdmin ? "No chores yet. Add some in Manage." : "No chores yet. The admin can add them."} />
            ) : (
              <ul className="divide-y divide-slate-100">
                {chores.map((a) => (
                  <li key={a.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <Avatar name={a.user.name} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-slate-900">{a.chore.title}</p>
                      <p className="text-sm text-slate-500">{a.user.id === me.id ? "You" : a.user.name}</p>
                    </div>
                    {a.done ? (
                      <span className="shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">Done</span>
                    ) : a.user.id === me.id || isAdmin ? (
                      <button onClick={() => markDone(a.id)} className="shrink-0 rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-dark">
                        Mark done
                      </button>
                    ) : (
                      <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">Pending</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title={`Flatmates (${house.members.length})`}>
            <ul className="divide-y divide-slate-100">
              {house.members.map((m) => (
                <li key={m.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <Avatar name={m.user.name} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-slate-900">
                      {m.user.name} {m.user.id === me.id && <span className="text-xs text-slate-400">(You)</span>}
                    </p>
                  </div>
                  <span className="text-xs text-slate-500">{m.role === "ADMIN" ? "Admin" : "Member"}</span>
                </li>
              ))}
            </ul>
          </Section>
        </div>
      </div>
    </div>
  );
}