import { useEffect, useState } from "react";
import { api } from "../api";
import type { HouseData } from "../types";

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

export default function HomeTab({ house }: { house: HouseData }) {
  const me = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = house.myRole === "ADMIN";
  const [chores, setChores] = useState<Assignment[]>([]);
  const [dues, setDues] = useState<Dues | null>(null);
  const [collect, setCollect] = useState<Collect | null>(null);
  const [plan, setPlan] = useState<Transfer[]>([]);

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

  function upiLink(upiId: string, name: string, rupees: number, note: string) {
    return `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(name)}&am=${rupees.toFixed(2)}&cu=INR&tn=${encodeURIComponent(note)}`;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-primary">{house.name}</h1>

      <section>
        <h2 className="font-semibold">Members ({house.members.length})</h2>
        <ul className="mt-2 space-y-1">
          {house.members.map((m) => (
            <li key={m.id} className="rounded-lg bg-white px-4 py-2">
              {m.user.name} <span className="text-xs text-gray-500">({m.role})</span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="font-semibold">Today's chores</h2>
        {chores.length === 0 ? (
          <p className="mt-2 text-sm text-gray-500">No chores yet.</p>
        ) : (
          <ul className="mt-2 space-y-1">
            {chores.map((a) => (
              <li key={a.id} className="flex items-center justify-between rounded-lg bg-white px-4 py-2">
                <span>
                  {a.chore.title} <span className="text-gray-500">- {a.user.name}</span>
                </span>
                {a.done ? (
                  <span className="text-sm text-green-600">Done</span>
                ) : a.user.id === me.id || isAdmin ? (
                  <button onClick={() => markDone(a.id)} className="rounded bg-primary px-3 py-1 text-sm text-white">
                    Mark done
                  </button>
                ) : (
                  <span className="text-sm text-gray-400">Pending</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="font-semibold">You owe</h2>
        <p className="mt-1 text-2xl font-bold">Rs {dues ? dues.totalRupees.toFixed(2) : "0.00"}</p>
        <ul className="mt-2 space-y-2">
          {dues?.dues.map((d) => {
            const rupees = d.share / 100;
            const upi = d.expense.paidBy.upiId;
            return (
              <li key={d.id} className="rounded-lg bg-white px-4 py-3 text-sm">
                <div className="flex justify-between">
                  <span>
                    {d.expense.title} <span className="text-gray-500">(to {d.expense.paidBy.name})</span>
                  </span>
                  <span>Rs {rupees.toFixed(2)}</span>
                </div>
                {upi ? (
                  <a
                    href={upiLink(upi, d.expense.paidBy.name, rupees, d.expense.title)}
                    className="mt-2 block rounded bg-primary py-2 text-center text-white"
                  >
                    Pay via UPI
                  </a>
                ) : (
                  <p className="mt-1 text-xs text-gray-500">{d.expense.paidBy.name} has not added a UPI id yet.</p>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {collect && collect.items.length > 0 && (
        <section>
          <h2 className="font-semibold">Others owe you</h2>
          <p className="mt-1 text-2xl font-bold">Rs {collect.totalRupees.toFixed(2)}</p>
          <ul className="mt-2 space-y-1">
            {collect.items.map((c) => (
              <li key={c.id} className="flex items-center justify-between rounded-lg bg-white px-4 py-2 text-sm">
                <span>
                  {c.user.name} <span className="text-gray-500">- {c.expense.title}</span>
                  <br />
                  Rs {(c.share / 100).toFixed(2)}
                </span>
                <button onClick={() => markReceived(c.id)} className="rounded bg-primary px-3 py-1 text-white">
                  Mark received
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="font-semibold">Settle-up plan (fewest payments)</h2>
        {plan.length === 0 ? (
          <p className="mt-2 text-sm text-gray-500">Everyone is settled up.</p>
        ) : (
          <ul className="mt-2 space-y-1">
            {plan.map((t, i) => (
              <li key={i} className="rounded-lg bg-white px-4 py-2 text-sm">
                {t.from.name} pays {t.to.name} <span className="font-bold">Rs {t.amountRupees.toFixed(2)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}