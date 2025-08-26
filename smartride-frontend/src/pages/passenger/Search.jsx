import { useState } from "react";
import api from "../../services/api";

export default function Search({ onBooking }) { // <-- accept onBooking callback
  const [q, setQ] = useState({ source: "", destination: "", date: "" });
  const [results, setResults] = useState([]);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [seatsMap, setSeatsMap] = useState({}); // per ride selected seats

  const formatCurrency = (amount) => `₹${amount}`;

  const onChange = (e) => setQ({ ...q, [e.target.name]: e.target.value });

  const search = async (e) => {
    e.preventDefault();
    setErr(""); setMsg("");
    try {
      const { data } = await api.get("/rides/search", {
        params: { source: q.source, destination: q.destination, date: q.date }
      });

      const mapped = data.map(r => {
        const dt = new Date(r.departureDatetime);
        return {
          ...r,
          departure_date: dt.toLocaleDateString(),
          departure_time: dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })
        };
      });

      setResults(mapped);
      setSeatsMap({});
    } catch (e) {
      setErr(e?.response?.data?.error || "Search failed");
    }
  };

  const book = async (rideId) => {
    setErr(""); setMsg("");
    const seats = Number(seatsMap[rideId] || 1);
    if (seats <= 0) {
      setErr("Seats must be greater than 0");
      return;
    }

    try {
      const { data } = await api.post("/bookings", { rideId: rideId, seats });
      setMsg("Booking confirmed");

      // Update seatsAvailable immediately
      setResults(results.map(r =>
        r.id === rideId
          ? { ...r, seatsAvailable: r.seatsAvailable - seats }
          : r
      ));

      // Update Passenger-side Bookings table live
      if (typeof onBooking === "function") {
        const ride = data.ride || {};
        const booking = data.booking;
        const totalPrice = booking.seatsBooked * (ride.price || 0);
        onBooking({
          id: booking.id,
          source: ride.source,
          destination: ride.destination,
          departure_date: new Date(ride.departureDatetime).toLocaleDateString(),
          departure_time: new Date(ride.departureDatetime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true }),
          seatsBooked: booking.seatsBooked,
          bookingStatus: booking.bookingStatus,
          totalPrice
        });
      }

      setSeatsMap({ ...seatsMap, [rideId]: 1 });
    } catch (e) {
      setErr(e?.response?.data?.error || "Booking failed");
    }
  };

  return (
    <div className="container py-5">
      <h2 className="mb-3">Search Rides</h2>
      {err && <div className="alert alert-danger">{err}</div>}
      {msg && <div className="alert alert-success">{msg}</div>}

      <form className="card p-3 shadow-sm mb-4" onSubmit={search}>
        <div className="row g-3 align-items-end">
          <div className="col-md-3">
            <label className="form-label">From</label>
            <input className="form-control" name="source" value={q.source} onChange={onChange} required />
          </div>
          <div className="col-md-3">
            <label className="form-label">To</label>
            <input className="form-control" name="destination" value={q.destination} onChange={onChange} required />
          </div>
          <div className="col-md-3">
            <label className="form-label">Date</label>
            <input type="date" className="form-control" name="date" value={q.date} onChange={onChange} required />
          </div>
          <div className="col-md-3">
            <button className="btn btn-primary w-100">Search</button>
          </div>
        </div>
      </form>

      <div className="table-responsive">
        <table className="table table-bordered align-middle">
          <thead>
            <tr>
              <th>From</th>
              <th>To</th>
              <th>Date</th>
              <th>Time</th>
              <th>Seats Avail</th>
              <th>Price per Seat</th>
              <th>Total Price</th>
              <th>Seats</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {results.map(r => {
              const selectedSeats = Number(seatsMap[r.id] || 1);
              const totalPrice = r.price * selectedSeats;
              return (
                <tr key={r.id}>
                  <td>{r.source}</td>
                  <td>{r.destination}</td>
                  <td>{r.departure_date}</td>
                  <td>{r.departure_time}</td>
                  <td>{r.seatsAvailable}</td>
                  <td>{formatCurrency(r.price)}</td>
                  <td>{formatCurrency(totalPrice)}</td>
                  <td>
                    <input
                      type="number"
                      min="1"
                      max={r.seatsAvailable}
                      className="form-control"
                      value={selectedSeats}
                      onChange={e => setSeatsMap({ ...seatsMap, [r.id]: e.target.value })}
                    />
                  </td>
                  <td>
                    <button
                      className="btn btn-success"
                      disabled={selectedSeats < 1 || r.seatsAvailable < 1}
                      onClick={() => book(r.id)}
                    >
                      Book
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
