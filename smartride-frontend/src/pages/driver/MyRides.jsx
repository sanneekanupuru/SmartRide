import { useEffect, useState } from "react";
import api from "../../services/api";

export default function MyRides() {
  const [rides, setRides] = useState([]);
  const [err, setErr] = useState("");

  const formatDateTime = (datetimeStr) => {
    if (!datetimeStr) return { date: "", time: "" };
    const dt = new Date(datetimeStr);
    return {
      date: dt.toLocaleDateString(),
      time: dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
  };

  const formatCurrency = (amount) => `₹${amount}`;

  const fetchRides = async () => {
    try {
      const { data } = await api.get("/rides/mine");
      const ridesWithRevenue = data.map(r => {
        const bookedSeats = r.seatsTotal - r.seatsAvailable;
        return { ...r, totalRevenue: bookedSeats * r.price };
      });
      setRides(ridesWithRevenue);
    } catch (e) {
      console.error(e);
      setErr(e?.response?.data?.error || "Failed to load rides");
    }
  };

  useEffect(() => {
    fetchRides();
  }, []);

  const handleBookingUpdate = (rideId, newSeatsAvailable) => {
    setRides(prev =>
      prev.map(r =>
        r.id === rideId
          ? { ...r, seatsAvailable: newSeatsAvailable, totalRevenue: (r.seatsTotal - newSeatsAvailable) * r.price }
          : r
      )
    );
  };

  return (
    <div className="container py-5">
      <h2 className="mb-3">My Rides</h2>
      {err && <div className="alert alert-danger">{err}</div>}
      <div className="table-responsive">
        <table className="table table-striped">
          <thead>
            <tr>
              <th>From</th>
              <th>To</th>
              <th>Date</th>
              <th>Time</th>
              <th>Seats Avail</th>
              <th>Price per Seat</th>
              <th>Total Revenue</th>
            </tr>
          </thead>
          <tbody>
            {rides.map(r => {
              const { date, time } = formatDateTime(r.departureDatetime);
              return (
                <tr key={r.id}>
                  <td>{r.source}</td>
                  <td>{r.destination}</td>
                  <td>{date}</td>
                  <td>{time}</td>
                  <td>{r.seatsAvailable}</td>
                  <td>{formatCurrency(r.price)}</td>
                  <td>{formatCurrency(r.totalRevenue)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
