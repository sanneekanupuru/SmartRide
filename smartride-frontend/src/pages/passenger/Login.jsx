import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function PassengerLogin() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [err, setErr] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      const res = await login({ ...form, roleHint: "PASSENGER" });
      if (res.role === "PASSENGER") navigate("/passenger/dashboard");
      else setErr("Unauthorized role");
    } catch (error) {
      setErr(error?.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-5rem)] px-4">
      <div className="w-full max-w-md bg-white shadow-lg rounded-2xl p-8">
        <h2 className="text-2xl font-bold text-center text-brandGreen mb-6">Passenger Login</h2>
        {err && <div className="alert alert-danger">{err}</div>}
        <form className="space-y-4" onSubmit={submit}>
          <input type="text" name="email" placeholder="Email or Phone Number" value={form.email} onChange={onChange} required className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-brandGreen outline-none" />
          <input type="password" name="password" placeholder="Password" value={form.password} onChange={onChange} required className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-brandGreen outline-none" />
          <button type="submit" className="w-full bg-brandGreen text-white py-2 rounded-lg font-medium hover:bg-green-700 transition">Login</button>
        </form>
        <p className="mt-6 text-center text-sm">
          Don’t have an account? <Link to="/passenger/register" className="text-brandGreen font-medium hover:underline">Register</Link>
        </p>
      </div>
    </div>
  );
}
