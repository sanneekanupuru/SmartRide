import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

export default function PassengerBookings() {
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const { data } = await api.get("/bookings/mine");
        // Always normalize into array
        setBookings(Array.isArray(data) ? data : data ? [data] : []);
      } catch (e) {
        setError(e?.response?.data?.error || "Failed to fetch bookings");
      }
    };
    fetchBookings();
  }, []);

  const formatDate = (b) =>
    b.departureDatetime
      ? new Date(b.departureDatetime).toLocaleDateString()
      : "";

  const formatTime = (b) =>
    b.departureDatetime
      ? new Date(b.departureDatetime).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
      : "";

  const getBookingBadge = (status) => {
    switch (status) {
      case "CONFIRMED":
        return <span className="badge bg-success me-2">Confirmed</span>;
      case "PENDING":
        return <span className="badge bg-warning text-dark me-2">Pending</span>;
      case "CANCELLED":
        return <span className="badge bg-danger me-2">Cancelled</span>;
      default:
        return <span className="badge bg-secondary me-2">{status}</span>;
    }
  };

  const getPaymentBadge = (status, method) => {
    if (status === "COMPLETED") {
      return (
        <span className="badge bg-success">
          Paid {method && `(${method})`}
        </span>
      );
    }
    return <span className="badge bg-danger">Pending</span>;
  };

  const handleRedirectToPayment = (booking) => {
    // go to PassengerPayment with bookingId
    navigate(`/passenger/payment/${booking.bookingId}`);
  };

  const handleCancel = async (bookingId) => {
    try {
      await api.post(`/bookings/${bookingId}/cancel`);
      alert("Booking Cancelled!");
      window.location.reload();
    } catch (err) {
      alert("Cancellation failed!");
    }
  };

  return (
    <div className="container py-5">
      <h2 className="mb-4">My Bookings</h2>
      {error && <div className="alert alert-danger">{error}</div>}

      {bookings.length === 0 ? (
        <div className="alert alert-info">No bookings found.</div>
      ) : (
        <div className="row">
          {bookings.map((b) => (
            <div className="col-12 mb-4" key={b.bookingId}>
              <div className="card shadow-sm h-100 border-0 rounded-3">
                <div className="card-body">
                  {/* Route */}
                  <h5 className="card-title mb-2">
                    {b.source} → {b.destination}
                  </h5>

                  {/* Fare details */}
                  <p className="mb-1 text-muted">Seats Booked: {b.seatsBooked}</p>
                  <p className="mb-2 text-dark fw-bold">
                    Total Fare: ₹{b.totalPrice?.toFixed(2) || 0}
                  </p>

                  {/* Driver */}
                  <p className="text-muted mb-1">
                    Driver: <strong>{b.driverName}</strong>
                  </p>

                  {/* Date + Time */}
                  <p className="text-muted mb-2">
                    Departure: {formatDate(b)} at {formatTime(b)}
                  </p>

                  {/* Status */}
                  <div className="mb-2">
                    Booking: {getBookingBadge(b.bookingStatus)} | Payment:{" "}
                    {getPaymentBadge(b.paymentStatus, b.paymentMethod)}
                  </div>

                  {/* Action Buttons */}
                  <div className="d-flex gap-2">
                    {b.paymentStatus === "PENDING" && (
                      <button
                        className="btn btn-sm btn-success"
                        onClick={() => handleRedirectToPayment(b)}
                      >
                        💳 Pay Now
                      </button>
                    )}
                    {b.bookingStatus === "PENDING" && (
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleCancel(b.bookingId)}
                      >
                        ❌ Cancel
                      </button>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="card-footer text-muted small text-end">
                  Booking ID: {b.bookingId} | Ride ID: {b.rideId}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
