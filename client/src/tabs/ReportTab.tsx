import { useEffect, useState } from "react";
import { api } from "../api";
import type { HouseData } from "../types";
import Section from "../components/Section";
import { inr } from "../utils";

type Report = {
  month: string;
  billCount: number;
  totalRupees: number;
  byCategory: { category: string; amountRupees: number }[];
  people: { name: string; paidRupees: number; shareRupees: number }[];
};

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function ReportTab({ house }: { house: HouseData }) {
  const [month, setMonth] = useState(currentMonth());
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get(`/houses/${house.id}/report`, { params: { month } })
      .then((r) => setReport(r.data))
      .finally(() => setLoading(false));
  }, [house.id, month]);

  const max = report ? Math.max(...report.byCategory.map((c) => c.amountRupees), 1) : 1;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">Monthly report</h1>
          <p className="text-sm text-slate-500">Where the house money went.</p>
        </div>
        <label className="label md:w-56">
          Month
          <input className="field mt-1" type="month" value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} />
        </label>
      </div>

      {loading && !report && <p className="text-sm text-slate-500">Loading...</p>}

      {report && (
        <>
          <div className="card grid grid-cols-2 divide-x divide-slate-200 p-0">
            <div className="p-5">
              <p className="text-sm text-slate-500">Total spent</p>
              <p className="mt-1 text-2xl font-bold text-slate-900 md:text-3xl">{inr(report.totalRupees)}</p>
            </div>
            <div className="p-5">
              <p className="text-sm text-slate-500">Bills</p>
              <p className="mt-1 text-2xl font-bold text-slate-900 md:text-3xl">{report.billCount}</p>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
            <Section title="Spending by category" hint="Biggest costs first.">
              {report.byCategory.length === 0 ? (
                <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500">No bills in this month.</p>
              ) : (
                <ul className="space-y-4">
                  {report.byCategory.map((c) => (
                    <li key={c.category}>
                      <div className="flex justify-between text-sm">
                        <span className="font-medium text-slate-900">{c.category}</span>
                        <span className="text-slate-600">
                          {inr(c.amountRupees)} · {Math.round((c.amountRupees / report.totalRupees) * 100)}%
                        </span>
                      </div>
                      <div className="mt-1 h-3 w-full overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-brand" style={{ width: `${(c.amountRupees / max) * 100}%` }} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            <Section title="Who paid and who owes" hint="Paid = money they spent. Share = their part of all bills.">
              {report.people.length === 0 ? (
                <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500">No bills in this month.</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {report.people.map((p) => (
                    <li key={p.name} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                      <span className="font-medium text-slate-900">{p.name}</span>
                      <span className="text-right text-sm text-slate-600">
                        Paid {inr(p.paidRupees)}
                        <br />
                        Share {inr(p.shareRupees)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Section>
          </div>
        </>
      )}
    </div>
  );
}