import { useEffect, useState, type ReactNode } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { api } from "../api";
import type { HouseData } from "../types";
import HomeTab from "../tabs/HomeTab";
import EditTab from "../tabs/EditTab";
import ProfileTab from "../tabs/ProfileTab";
import Logo from "../components/Logo";

type Tab = "home" | "edit" | "profile";

const labels: Record<Tab, string> = { home: "Home", edit: "Manage", profile: "Profile" };

const icons: Record<Tab, ReactNode> = {
  home: <path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />,
  edit: (
    <>
      <path d="M4 6h8M16 6h4M4 12h2M10 12h10M4 18h10M18 18h2" />
      <circle cx="14" cy="6" r="2" />
      <circle cx="8" cy="12" r="2" />
      <circle cx="16" cy="18" r="2" />
    </>
  ),
  profile: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
    </>
  ),
};

function Icon({ name, className }: { name: Tab; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      {icons[name]}
    </svg>
  );
}

export default function Home() {
  const { id } = useParams();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
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
    return <div className="flex min-h-screen items-center justify-center text-slate-500">Loading your house...</div>;
  }

  if (error || !house) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-red-600">{error || "Something went wrong"}</p>
        <button onClick={loadHouse} className="btn-primary max-w-xs">Try again</button>
        <Link to="/choose" className="text-sm text-slate-500 underline">Back to my houses</Link>
      </div>
    );
  }

  const isAdmin = house.myRole === "ADMIN";
  const tabs: Tab[] = isAdmin ? ["home", "edit", "profile"] : ["home", "profile"];

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-page">
      {/* Sidebar: laptop */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-slate-200 bg-white p-5 md:flex">
        <div className="flex items-center gap-3">
          <Logo size={40} />
          <span className="text-lg font-bold text-slate-900">RoomSplit</span>
        </div>

        <div className="mt-6 rounded-xl bg-page p-3">
          <p className="text-xs text-slate-500">Current house</p>
          <p className="truncate font-semibold text-slate-900">{house.name}</p>
          <Link to="/choose" className="text-xs font-semibold text-brand">Switch house</Link>
        </div>

        <nav className="mt-6 flex flex-col gap-1">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                tab === t ? "bg-brand-soft text-brand" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Icon name={t} className="h-5 w-5" />
              {labels[t]}
            </button>
          ))}
        </nav>

        <div className="mt-auto flex items-center gap-3 border-t border-slate-200 pt-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-soft font-bold text-brand">
            {(user.name || "?").charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">{user.name}</p>
            <p className="text-xs text-slate-500">{isAdmin ? "Admin" : "Member"}</p>
          </div>
        </div>
      </aside>

      {/* Everything to the right of the sidebar */}
      <div className="min-w-0 md:pl-64">
        {/* Top bar: phone */}
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 md:hidden">
          <div className="flex items-center gap-3">
            <Logo size={34} />
            <span className="font-semibold text-slate-900">{house.name}</span>
          </div>
          <Link to="/choose" className="text-xs font-semibold text-brand">Switch</Link>
        </header>

        <main className="w-full min-w-0 px-4 pb-28 pt-5 md:px-8 md:pb-10 md:pt-8">
          <div className="mx-auto w-full min-w-0 max-w-6xl">
            {tab === "home" && <HomeTab house={house} />}
            {tab === "edit" && isAdmin && <EditTab house={house} />}
            {tab === "profile" && <ProfileTab house={house} />}
          </div>
        </main>
      </div>

      {/* Bottom bar: phone */}
      <nav className="fixed inset-x-0 bottom-0 z-10 flex border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium ${tab === t ? "text-brand" : "text-slate-400"}`}
          >
            <Icon name={t} className="h-6 w-6" />
            {labels[t]}
          </button>
        ))}
      </nav>
    </div>
  );
}