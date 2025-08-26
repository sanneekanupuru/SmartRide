import { useState } from "react";
import api from "../../services/api";

export default function PostRide() {
  const [form, setForm] = useState({
    source: "",
    destination: "",
    date: "",
    time: "",
    seatsTotal: 1,
    price: ""   // <-- added price
  });
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const onChange = (e) => {
    const key = e.target.name;
    let value = e.target.value;
    if (key === "seatsTotal") value = Number(value);
    if (key === "price") value = parseFloat(value); // convert price to number
    setForm({ ...form, [key]: value });
  };

  const submit = async (e) => {
    e.preventDefault();
    setMsg(""); setErr("");
    try {
      await api.post("/rides", form);
      setMsg("Ride posted successfully");
      setForm({ source: "", destination: "", date: "", time: "", seatsTotal: 1, price: "" });
    } catch (error) {
      console.error(error);
      if (error.response) {
        if (error.response.status === 401) setErr("Unauthorized. Please login.");
        else if (error.response.status === 403) setErr("Forbidden. Only DRIVER can post rides.");
        else setErr(error.response.data?.error || "Failed to post ride");
      } else {
        setErr("Network or server error");
      }
    }
  };

  return (
    <div className="container py-5" style={{ maxWidth: 720 }}>
      <h2 className="mb-3">Post a Ride</h2>
      {msg && <div className="alert alert-success">{msg}</div>}
      {err && <div className="alert alert-danger">{err}</div>}
      <form className="card p-4 shadow-sm" onSubmit={submit}>
        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label">Source</label>
            <input className="form-control" name="source" value={form.source} onChange={onChange} required />
          </div>
          <div className="col-md-6">
            <label className="form-label">Destination</label>
            <input className="form-control" name="destination" value={form.destination} onChange={onChange} required />
          </div>
          <div className="col-md-6">
            <label className="form-label">Date</label>
            <input type="date" className="form-control" name="date" value={form.date} onChange={onChange} required />
          </div>
          <div className="col-md-6">
            <label className="form-label">Time</label>
            <input type="time" className="form-control" name="time" value={form.time} onChange={onChange} required />
          </div>
          <div className="col-md-6">
            <label className="form-label">Seats Available</label>
            <input type="number" min="1" className="form-control" name="seatsTotal" value={form.seatsTotal} onChange={onChange} required />
          </div>
          <div className="col-md-6">
            <label className="form-label">Price per Seat</label>  {/* <-- new input */}
            <input type="number" min="0" step="0.01" className="form-control" name="price" value={form.price} onChange={onChange} required />
          </div>
          <div className="col-12 text-end">
            <button type="submit" className="btn btn-primary">Post Ride</button>
          </div>
        </div>
      </form>
    </div>
  );
}
