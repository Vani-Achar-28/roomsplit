import { Link } from "react-router-dom";
import SplitPage from "../components/SplitPage";

const features = [
  { title: "Split bills automatically", text: "Rent, electricity and WiFi, divided fairly." },
  { title: "Rotate daily chores", text: "Everyone gets a turn, no arguments." },
  { title: "Pay with UPI", text: "One tap opens GPay or PhonePe." },
];

export default function Welcome() {
  return (
    <SplitPage title="Shared living, made simple" subtitle="Bills, chores and payments for PGs and flatmates.">
      <ul className="space-y-4">
        {features.map((f) => (
          <li key={f.title} className="flex items-start gap-3">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-soft text-sm font-bold text-brand">✓</span>
            <div>
              <p className="font-semibold text-slate-900">{f.title}</p>
              <p className="text-sm text-slate-500">{f.text}</p>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-8 space-y-3">
        <Link to="/signup" className="btn-primary block">
          Create account
        </Link>
        <Link to="/login" className="btn-outline block">
          I already have an account
        </Link>
      </div>
    </SplitPage>
  );
}