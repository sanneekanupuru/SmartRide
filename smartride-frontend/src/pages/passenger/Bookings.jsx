import { useEffect, useState } from "react";
import api from "../../services/api";

export default function Bookings({ liveBookings }) { // optional prop for live updates
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState("");

  const formatCurrency = (amount) => `₹${amount}`;

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    if (liveBookings && Array.isArray(liveBookings)) {
      setRows(liveBookings);
    }
  }, [liveBookings]);

  const fetchBookings = async () => {
    try {
      const { data } = await api.get("/bookings/mine");

      const mapped = data.map(b => {
        const dt = new Date(b.departureDatetime || b.createdAt);
        return {
          id: b.id,
          source: b.source || "",
          destination: b.destination || "",
          departure_date: dt.toLocaleDateString(),
          departure_time: dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true }),
          seatsBooked: b.seatsBooked,
          bookingStatus: b.bookingStatus,
          totalPrice: b.seatsBooked * (b.price || 0)
        };
      });

      setRows(mapped);
    } catch (e) {
      setErr(e?.response?.data?.error || "Failed to load bookings");
    }
  };

  return (
    <div className="container py-5">
      <h2 className="mb-3">My Bookings</h2>
      {err && <div className="alert alert-danger">{err}</div>}
      <div className="table-responsive">
        <table className="table table-striped">
          <thead>
            <tr>
              <th>From → To</th>
              <th>Date</th>
              <th>Time</th>
              <th>Seats</th>
              <th>Status</th>
              <th>Total Price</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(b => (
              <tr key={b.id}>
                <td>{b.source} → {b.destination}</td>
                <td>{b.departure_date}</td>
                <td>{b.departure_time}</td>
                <td>{b.seatsBooked}</td>
                <td>{b.bookingStatus}</td>
                <td>{formatCurrency(b.totalPrice)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
