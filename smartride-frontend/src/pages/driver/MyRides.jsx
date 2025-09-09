import { useEffect, useState } from "react";
import api from "../../services/api";

export default function DriverMyRides() {
  const [rides, setRides] = useState([]);
  const [err, setErr] = useState("");

  const formatDate = (dtStr) => dtStr ? new Date(dtStr).toLocaleDateString() : "";
  const formatTime = (dtStr) => dtStr ? new Date(dtStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true }) : "";
  const formatCurrency = (amount) => `₹${amount?.toFixed(2) || "0.00"}`;

  const fetchRides = async () => {
    try {
      const { data } = await api.get("/rides/mine");
      setRides(Array.isArray(data) ? data : data ? [data] : []);
    } catch (e) {
      console.error(e);
      setErr(e?.response?.data?.error || "Failed to load rides");
    }
  };

  useEffect(() => { fetchRides(); }, []);

  const handleMarkPaid = async (paymentId) => {
    try {
      await api.patch(`/payments/${paymentId}/status?status=COMPLETED`);
      alert("✅ Payment marked as completed!");
      fetchRides();
    } catch (e) {
      console.error(e);
      alert("❌ Failed to update payment status");
    }
  };

  const getBookingBadge = (status) => {
    switch(status) {
      case "CONFIRMED": return <span className="badge bg-success me-2">Confirmed</span>;
      case "PENDING": return <span className="badge bg-warning text-dark me-2">Pending</span>;
      case "CANCELLED": return <span className="badge bg-danger me-2">Cancelled</span>;
      default: return <span className="badge bg-secondary me-2">{status}</span>;
    }
  };

  const getPaymentBadge = (status, method) => {
    if(status?.toUpperCase() === "COMPLETED") return <span className="badge bg-success">{method || "Paid"}</span>;
    return <span className="badge bg-danger">Pending</span>;
  };

  return (
    <div className="container py-5">
      <h2 className="mb-4">My Rides</h2>
      {err && <div className="alert alert-danger">{err}</div>}

      {rides.length === 0 ? (
        <div className="alert alert-info">No rides found.</div>
      ) : (
        <div className="row">
          {rides.map((ride) => {
            const totalRevenue = ride.bookings?.reduce((sum, b) => sum + (b.totalPrice ? parseFloat(b.totalPrice) : 0), 0);
            const totalSeatsBooked = ride.bookings?.reduce((sum, b) => sum + (b.seatsBooked || 0), 0);
            return (
              <div className="col-12 mb-4" key={ride.rideId}>
                <div className="card shadow-sm h-100 border-0 rounded-3">
                  <div className="card-body">
                    <h5 className="card-title mb-2">{ride.source} → {ride.destination}</h5>
                    <p className="mb-1 text-muted">Departure: {formatDate(ride.departureDatetime)} at {formatTime(ride.departureDatetime)}</p>
                    <p className="mb-1 text-muted">Seats Filled: {totalSeatsBooked} / {ride.seatsTotal || 0}</p>
                    <p className="mb-2 text-dark fw-bold">Total Revenue: {formatCurrency(totalRevenue)}</p>

                    {ride.bookings && ride.bookings.length > 0 ? (
                      <ul className="list-unstyled">
                        {ride.bookings.map((b) => (
                          <li key={b.bookingId} className="mb-2">
                            {b.passengerName} – {b.seatsBooked} seat(s) – {formatCurrency(b.totalPrice || 0)} | {getBookingBadge(b.bookingStatus)} {getPaymentBadge(b.paymentStatus, b.paymentMethod)}
                            {b.paymentMethod?.toUpperCase() === "CASH" && b.paymentStatus?.toUpperCase() === "PENDING" && (
                              <button className="btn btn-sm btn-success ms-2" onClick={() => handleMarkPaid(b.paymentId)}>
                                Mark as Paid
                              </button>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>No bookings yet</p>
                    )}
                  </div>

                  <div className="card-footer text-muted small text-end">
                    Ride ID: {ride.rideId}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  );
}
