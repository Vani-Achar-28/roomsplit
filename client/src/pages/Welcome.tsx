import { Link } from "react-router-dom";

export default function Welcome() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-6 text-center">
      <h1 className="text-3xl font-bold text-primary">Welcome to RoomSplit</h1>
      <p className="mt-2 text-gray-600">Split bills and share chores with your flatmates.</p>
      <div className="mt-8 flex w-full max-w-xs flex-col gap-3">
        <Link to="/login" className="rounded-lg bg-primary py-3 text-center text-white">
          Login
        </Link>
        <Link to="/signup" className="rounded-lg border border-primary py-3 text-center text-primary">
          Sign up
        </Link>
      </div>
    </div>
  );
}