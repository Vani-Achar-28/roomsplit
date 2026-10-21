import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { api } from "../api";
import type { HouseData } from "../types";
import HomeTab from "../tabs/HomeTab";
import EditTab from "../tabs/EditTab";
import ProfileTab from "../tabs/ProfileTab";

type Tab = "home" | "edit" | "profile";

export default function Home() {
  const { id } = useParams();
  const [house, setHouse] = useState<HouseData | null>(null);
  const [tab, setTab] = useState<Tab>("home");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  function loadHouse() {
    setLoading(true);
    setError("");
    api
      .get(`/houses/${id}`)
      .then((res) => setHouse(res.data))
      .catch((err) => {
        if (axios.isAxiosError(err) && err.response) {
          setError(err.response.data?.error ?? "Could not load this house");
        } else {
          setError("Cannot reach the server. It may be waking up, please try again.");
        }
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadHouse();
  }, [id]);

  if (loading && !house) {
    return (
      <div className="flex min-h-screen items-center justify-center text-gray-600">
        Loading your house...
      </div>
    );
  }

  if (error || !house) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-red-600">{error || "Something went wrong"}</p>
        <button onClick={loadHouse} className="rounded-lg bg-primary px-6 py-3 text-white">
          Try again
        </button>
        <Link to="/choose" className="text-sm text-gray-500 underline">
          Back to my houses
        </Link>
      </div>
    );
  }

  const isAdmin = house.myRole === "ADMIN";
  const tabs: { key: Tab; label: string }[] = [{ key: "home", label: "Home" }];
  if (isAdmin) tabs.push({ key: "edit", label: "Edit" });
  tabs.push({ key: "profile", label: "Profile" });

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="hidden items-center justify-between border-b border-gray-200 bg-white px-8 py-4 md:flex">
        <span className="text-xl font-bold text-primary">RoomSplit</span>
        <nav className="flex gap-8">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={tab === t.key ? "font-bold text-primary" : "text-gray-500 hover:text-primary"}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto w-full max-w-3xl p-6 pb-24 md:pb-10">
        {tab === "home" && <HomeTab house={house} />}
        {tab === "edit" && isAdmin && <EditTab house={house} />}
        {tab === "profile" && <ProfileTab house={house} />}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 flex border-t border-gray-200 bg-white md:hidden">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-4 text-sm ${tab === t.key ? "font-bold text-primary" : "text-gray-500"}`}
          >
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  );
}