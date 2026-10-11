import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
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

  function loadHouse() {
    api.get(`/houses/${id}`).then((res) => setHouse(res.data));
  }

  useEffect(() => {
    loadHouse();
  }, [id]);

  if (!house) return <p className="p-6">Loading...</p>;

  const isAdmin = house.myRole === "ADMIN";
  const tabs: { key: Tab; label: string }[] = [{ key: "home", label: "Home" }];
  if (isAdmin) tabs.push({ key: "edit", label: "Edit" });
  tabs.push({ key: "profile", label: "Profile" });

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="p-6">
        {tab === "home" && <HomeTab house={house} />}
        {tab === "edit" && isAdmin && <EditTab house={house} />}
        {tab === "profile" && <ProfileTab house={house} />}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 flex border-t border-gray-200 bg-white">
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