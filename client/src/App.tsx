import { Routes, Route } from "react-router-dom";
import Welcome from "./pages/Welcome";
import AuthPage from "./pages/AuthPage";
import Choose from "./pages/Choose";
import CreateHouse from "./pages/CreateHouse";
import JoinHouse from "./pages/JoinHouse";
import Home from "./pages/Home";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Welcome />} />
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/signup" element={<AuthPage mode="signup" />} />
      <Route path="/choose" element={<Choose />} />
      <Route path="/create-house" element={<CreateHouse />} />
      <Route path="/join-house" element={<JoinHouse />} />
      <Route path="/house/:id" element={<Home />} />
    </Routes>
  );
}