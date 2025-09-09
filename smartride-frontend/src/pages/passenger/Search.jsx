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

  const handleChange = (e) => {
    setQuery({ ...query, [e.target.name]: e.target.value });
  };

  const searchRides = async (e) => {
    e.preventDefault();
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

  const bookRide = async (rideId) => {
    setError("");
    setMsg("");
    const seats = Number(seatsMap[rideId] || 1);
    if (seats <= 0) {
      setError("Seats must be greater than 0");
      return;
    }

    try {
      const { data } = await api.post(`/bookings/${rideId}`, null, { params: { seats } });
      navigate(`/passenger/payment/${data.bookingId}`);
    } catch (e) {
      setError(e?.response?.data?.error || "Booking failed");
    }
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
                        Book
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
