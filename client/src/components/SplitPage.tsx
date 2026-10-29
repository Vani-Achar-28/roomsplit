import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import Logo from "./Logo";

export default function SplitPage({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-white md:grid md:grid-cols-2">
      <div className="bg-brand px-6 pb-14 pt-10 text-white md:flex md:min-h-screen md:flex-col md:justify-center md:px-16 md:pb-10 lg:px-24">
        <Link to="/" className="flex items-center gap-3">
          <Logo light size={44} />
          <span className="text-xl font-bold">RoomSplit</span>
        </Link>
        <h1 className="mt-8 text-3xl font-bold md:text-5xl">{title}</h1>
        <p className="mt-2 max-w-md text-white/80 md:text-lg">{subtitle}</p>
      </div>

      <div className="-mt-6 flex-1 rounded-t-3xl bg-white px-6 py-8 md:mt-0 md:flex md:items-center md:rounded-none md:bg-page md:px-16 lg:px-24">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}