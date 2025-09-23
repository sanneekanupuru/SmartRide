// src/pages/passenger/Bookings.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { submitReview, fetchUserProfile } from "../../services/api";
import ReviewForm from "../../components/ReviewForm";
import UserProfileModal from "../../components/UserProfileModal";
import UserCard from "../../components/UserCard";

export default function PassengerBookings() {
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState("");
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewMeta, setReviewMeta] = useState({});
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileForModal, setProfileForModal] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const { data } = await api.get("/bookings/mine");
      setBookings(Array.isArray(data) ? data : data ? [data] : []);
      setError("");
    } catch (e) {
      setError(e?.response?.data?.error || "Failed to fetch bookings");
    }
  };

  const formatDate = (b) =>
    b.departureDatetime ? new Date(b.departureDatetime).toLocaleDateString() : "";

  const formatTime = (b) =>
    b.departureDatetime
      ? new Date(b.departureDatetime).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
      : "";

  const handleRedirectToPayment = (booking) => {
    if (!booking.driverApproved) {
      alert("Driver has not approved the booking yet. Please wait.");
      return;
    }
    navigate(`/passenger/payment/${booking.bookingId}`);
  };

  const handleCancel = async (bookingId) => {
    try {
      await api.post(`/bookings/${bookingId}/cancel`);
      alert("Booking Cancelled!");
      await fetchBookings();
    } catch (err) {
      alert("Cancellation failed!");
    }
  };

  const isReviewable = (b) => {
    if (!b?.departureDatetime) return false;
    const dep = new Date(b.departureDatetime).getTime();
    const now = Date.now();
    return dep < now && b.bookingStatus !== "CANCELLED";
  };

  // open profile modal (loads full profile)
  const openProfile = async (userId) => {
    try {
      const res = await fetchUserProfile(userId);
      setProfileForModal(res.data);
      setProfileModalOpen(true);
    } catch (err) {
      console.error("Failed to load profile", err);
      alert("Failed to load profile");
    }
  };

  // Prepare review meta and open review modal. Will attempt fallback fetch if driver id missing.
  const openReviewForBooking = async (b) => {
    let revieweeId = b.driverId ?? (b.driver && (b.driver.id ?? null)) ?? null;
    let name = b.driverName ?? (b.driver && (b.driver.name ?? b.driver.fullName)) ?? "Driver";
    const rideId = b.rideId ?? b.ride?.id ?? null;
    const bookingId = b.bookingId ?? b.id ?? null;

    if (!revieweeId && bookingId) {
      try {
        const res = await api.get(`/bookings/${bookingId}`);
        const bookingFull = res.data || {};
        revieweeId = bookingFull.driverId ?? (bookingFull.driver && (bookingFull.driver.id ?? null)) ?? revieweeId;
        name = name === "Driver" ? (bookingFull.driverName ?? (bookingFull.driver && bookingFull.driver.name) ?? name) : name;
      } catch (err) {
        console.debug("[openReviewForBooking] failed fallback fetch", err);
      }
    }

    if (!revieweeId) {
      alert("Cannot open review: driver information is missing. Please refresh the page or contact support.");
      return;
    }

    setReviewMeta({
      title: `Review ${name}`,
      revieweeName: name,
      rideId,
      bookingId,
      revieweeId,
    });
    setReviewModalOpen(true);
  };

  const onReviewSubmitted = async (payload) => {
    try {
      await submitReview(payload);
      await fetchBookings();
      alert("Thanks — your review has been submitted.");
    } catch (err) {
      console.error("Submit review failed", err);
      alert(err?.response?.data?.error || "Failed to submit review");
    }
  };

  return (
    <div className="container py-5">
      <h2 className="mb-4">My Bookings</h2>
      {error && <div className="alert alert-danger">{error}</div>}

      {bookings.length === 0 ? (
        <div className="alert alert-info">No bookings found.</div>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => (
            <div
              key={b.bookingId}
              className="bg-white rounded-xl shadow-sm hover:shadow-md transition overflow-hidden border"
            >
              {/* header */}
              <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-white flex justify-between items-center">
                <div className="font-semibold text-gray-800">{b.source} → {b.destination}</div>
                <div className="text-sm text-gray-500">Booking ID: {b.bookingId} | Ride ID: {b.rideId}</div>
              </div>

              {/* body */}
              <div className="p-4 md:flex md:items-start md:gap-6">
                {/* left: profile */}
                <div className="md:w-56 w-full">
                  <div className="d-flex align-items-start">
                    {/* Use your UserCard to show rating & name (will fetch profile) */}
                    <div style={{ minWidth: 160 }}>
                      <UserCard userId={b.driverId} fallbackName={b.driverName || "Driver"} small={true} />
                      <div className="mt-2">
                        <button
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => openProfile(b.driverId ?? b.driver?.id)}
                        >
                          View profile
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* right: booking details */}
                <div className="flex-1 mt-3 md:mt-0">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-start">
                    <div>
                      <div className="text-sm text-gray-600">Seats Booked: <strong>{b.seatsBooked}</strong></div>
                      <div className="text-lg font-semibold mt-2">Total Fare: ₹{b.totalPrice ? Number(b.totalPrice).toFixed(2) : "—"}</div>
                      <div className="text-sm text-gray-600 mt-2">Departure: {formatDate(b)} at {formatTime(b)}</div>
                    </div>

                    <div className="mt-3 md:mt-0 text-right">
                      <div className="mb-3">
                        <span className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold mr-2">
                          {b.bookingStatus}
                        </span>
                        <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold">
                          {b.paymentStatus}{b.paymentMethod ? ` (${b.paymentMethod})` : ""}
                        </span>
                      </div>

                      <div className="flex gap-2 justify-end">
                        {b.paymentStatus === "PENDING" && b.driverApproved && (
                          <button className="btn btn-sm btn-success" onClick={() => handleRedirectToPayment(b)}>
                            💳 Pay Now
                          </button>
                        )}
                        {b.paymentStatus === "PENDING" && !b.driverApproved && (
                          <button className="btn btn-sm btn-secondary" disabled>⏳ Waiting for driver approval</button>
                        )}
                        {b.bookingStatus === "PENDING" && (
                          <button className="btn btn-sm btn-outline-danger" onClick={() => handleCancel(b.bookingId)}>❌ Cancel</button>
                        )}
                        {isReviewable(b) && (
                          <button className="btn btn-sm btn-outline-primary" onClick={() => openReviewForBooking(b)}>⭐ Leave Review</button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

      <ReviewForm
        open={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        onSubmit={onReviewSubmitted}
        meta={reviewMeta}
      />

      <UserProfileModal
        open={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        profile={profileForModal}
      />
    </div>
  );
}
