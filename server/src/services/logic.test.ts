import { describe, it, expect } from "vitest";
import { splitEqual, splitByWeights } from "./split";
import { simplifyDebts } from "./debts";
import { memberIndexFor } from "./rotation";

const sum = (a: { share: number }[]) => a.reduce((s, x) => s + x.share, 0);

describe("splitEqual", () => {
  it("adds up to the exact total", () => {
    expect(sum(splitEqual(100000, [1, 2, 3]))).toBe(100000);
  });
  it("gives leftover paise to the first people", () => {
    expect(splitEqual(100000, [1, 2, 3]).map((s) => s.share)).toEqual([33334, 33333, 33333]);
  });
});

describe("splitByWeights", () => {
  it("splits by days present", () => {
    const r = splitByWeights(100000, [
      { userId: 1, weight: 30 },
      { userId: 2, weight: 20 },
      { userId: 3, weight: 30 },
    ]);
    expect(r.map((s) => s.share)).toEqual([37500, 25000, 37500]);
  });
  it("always adds up to the exact total", () => {
    const r = splitByWeights(100001, [
      { userId: 1, weight: 7 },
      { userId: 2, weight: 11 },
      { userId: 3, weight: 13 },
    ]);
    expect(sum(r)).toBe(100001);
  });
});

describe("simplifyDebts", () => {
  it("collapses a chain into one payment", () => {
    const t = simplifyDebts([
      { userId: 1, net: -300 }, // Ravi owes
      { userId: 2, net: 0 },
      { userId: 3, net: 300 }, // Asha is owed
    ]);
    expect(t).toEqual([{ fromUserId: 1, toUserId: 3, amount: 300 }]);
  });
  it("settles everyone to zero", () => {
    const t = simplifyDebts([
      { userId: 1, net: -500 },
      { userId: 2, net: -200 },
      { userId: 3, net: 700 },
    ]);
    expect(t.reduce((s, x) => s + x.amount, 0)).toBe(700);
  });
});

describe("chore rotation", () => {
  it("gives different people different chores on the same day", () => {
    const d = new Date(Date.UTC(2026, 9, 21));
    const people = [0, 1, 2].map((c) => memberIndexFor(c, 3, d));
    expect(new Set(people).size).toBe(3);
  });
  it("shifts every day", () => {
    const d1 = new Date(Date.UTC(2026, 9, 21));
    const d2 = new Date(Date.UTC(2026, 9, 22));
    expect(memberIndexFor(0, 3, d1)).not.toBe(memberIndexFor(0, 3, d2));
  });
});