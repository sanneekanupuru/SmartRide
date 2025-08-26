import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function PassengerRegister() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const { register } = useAuth();
  const navigate = useNavigate();

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setErr(""); setMsg("");
    try {
      await register({ ...form, role: "PASSENGER" });
      setMsg("Registered successfully. Redirecting to login...");
      setTimeout(() => navigate("/passenger/login"), 1500);
    } catch (error) {
      setErr(error?.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-5rem)] px-4">
      <div className="w-full max-w-md bg-white shadow-lg rounded-2xl p-8">
        <h2 className="text-2xl font-bold text-center text-brandGreen mb-6">Passenger Register</h2>
        {msg && <div className="alert alert-success">{msg}</div>}
        {err && <div className="alert alert-danger">{err}</div>}
        <form className="space-y-4" onSubmit={submit}>
          <input type="text" name="name" placeholder="Full Name" value={form.name} onChange={onChange} required className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-brandGreen outline-none" />
          <input type="email" name="email" placeholder="Email" value={form.email} onChange={onChange} required className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-brandGreen outline-none" />
          <input type="text" name="phone" placeholder="Phone Number" value={form.phone} onChange={onChange} required className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-brandGreen outline-none" />
          <input type="password" name="password" placeholder="Password" value={form.password} onChange={onChange} required className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-brandGreen outline-none" />
          <button type="submit" className="w-full bg-brandGreen text-white py-2 rounded-lg font-medium hover:bg-green-700 transition">Register</button>
        </form>
        <p className="mt-6 text-center text-sm">
          Already have an account? <Link to="/passenger/login" className="text-brandGreen font-medium hover:underline">Login</Link>
        </p>
      </div>
    </div>
  );
}
