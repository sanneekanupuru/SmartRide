import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

export default function PassengerSearch() {
  const navigate = useNavigate();
  const [query, setQuery] = useState({ source: "", destination: "", date: "" });
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [seatsMap, setSeatsMap] = useState({});
  const [showRequestSent, setShowRequestSent] = useState(false);
  const [recentBooking, setRecentBooking] = useState(null);

  const handleChange = (e) => {
    setQuery({ ...query, [e.target.name]: e.target.value });
  };

  const searchRides = async (e) => {
    e?.preventDefault();
    setError("");
    setMsg("");
    try {
      const { data } = await api.get("/rides/search", {
        params: {
          source: query.source,
          destination: query.destination,
          date: query.date,
        },
      });

      if (!Array.isArray(data) || data.length === 0) {
        setResults([]);
        setError("No rides found for selected route and date.");
        return;
      }

      const mapped = data.map((ride) => {
        const dt = new Date(ride.departureDatetime);
        return {
          ...ride,
          departure_date: dt.toLocaleDateString(),
          departure_time: dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true }),
        };
      });

      setResults(mapped);
      setSeatsMap({});
    } catch (e) {
      setError(e?.response?.data?.error || "Search failed");
    }
  };

  // New: create booking request but DO NOT navigate to payment.
  const bookRide = async (rideId) => {
    setError("");
    setMsg("");
    const seats = Number(seatsMap[rideId] || 1);
    if (seats <= 0) {
      setError("Seats must be greater than 0");
      return;
    }

    try {
      const res = await api.post(`/bookings/${rideId}`, null, { params: { seats } });
      const bookingDto = res.data;
      // Show a friendly popup / alert telling user request was sent and to wait for approval
      setRecentBooking(bookingDto);
      setShowRequestSent(true);

      // Optionally refresh local UI (e.g., bookings) if you want:
      setMsg("Request sent to driver. Wait for approval.");
    } catch (e) {
      setError(e?.response?.data?.error || "Booking failed");
    }
  };

  const closeRequestModal = () => {
    setShowRequestSent(false);
    // You can navigate to "My Bookings" or refresh bookings from here if you like:
    // navigate("/passenger/bookings");
  };

  return (
    <div className="container py-5">
      <h2 className="mb-3">Search Rides</h2>

      {error && <div className="alert alert-danger">{error}</div>}
      {msg && <div className="alert alert-success">{msg}</div>}

      <form className="card p-3 shadow-sm mb-4" onSubmit={searchRides}>
        <div className="row g-3 align-items-end">
          <div className="col-md-3">
            <label className="form-label">From</label>
            <input className="form-control" name="source" value={query.source} onChange={handleChange} required />
          </div>
          <div className="col-md-3">
            <label className="form-label">To</label>
            <input className="form-control" name="destination" value={query.destination} onChange={handleChange} required />
          </div>
          <div className="col-md-3">
            <label className="form-label">Date</label>
            <input type="date" className="form-control" name="date" value={query.date} onChange={handleChange} required />
          </div>
          <div className="col-md-3">
            <button className="btn btn-primary w-100">Search</button>
          </div>
        </div>
      </form>

      {results.length > 0 && (
        <div className="table-responsive">
          <table className="table table-bordered align-middle shadow-sm">
            <thead className="table-light">
              <tr>
                <th>Ride ID</th>
                <th>From</th>
                <th>To</th>
                <th>Date</th>
                <th>Time</th>
                <th>Driver</th>
                <th>Seats Available</th>
                <th>Seats</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {results.map((ride) => {
                const selectedSeats = Number(seatsMap[ride.rideId] || 1);
                return (
                  <tr key={ride.rideId}>
                    <td>{ride.rideId}</td>
                    <td>{ride.source}</td>
                    <td>{ride.destination}</td>
                    <td>{ride.departure_date}</td>
                    <td>{ride.departure_time}</td>
                    <td>{ride.driverName}</td>
                    <td>{ride.seatsAvailable}</td>
                    <td>
                      <input
                        type="number"
                        min="1"
                        max={ride.seatsAvailable}
                        className="form-control"
                        value={selectedSeats}
                        onChange={(e) => setSeatsMap({ ...seatsMap, [ride.rideId]: e.target.value })}
                      />
                    </td>
                    <td>
                      <button
                        className="btn btn-success"
                        disabled={selectedSeats < 1 || ride.seatsAvailable < 1}
                        onClick={() => bookRide(ride.rideId)}
                      >
                        Request Ride
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Simple modal / information card when request sent */}
      {showRequestSent && recentBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="bg-black/40 absolute inset-0" onClick={closeRequestModal}></div>
          <div className="bg-white rounded-lg p-6 shadow-lg z-50 w-11/12 md:w-1/2">
            <h4 className="mb-3">Request Sent</h4>
            <p className="mb-2">Your request for <strong>{recentBooking.seatsBooked}</strong> seat(s) on <strong>{recentBooking.source} → {recentBooking.destination}</strong> has been sent to the driver.</p>
            <p className="mb-3">Please wait for the driver's approval. You will receive an in-app notification and email when the driver approves.</p>
            <div className="text-end">
              <button className="btn btn-secondary me-2" onClick={closeRequestModal}>Close</button>
              <button className="btn btn-primary" onClick={() => { closeRequestModal(); navigate("/passenger/bookings"); }}>View My Bookings</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
