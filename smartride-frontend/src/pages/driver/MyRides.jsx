// src/pages/driver/MyRides.jsx
import React, { useEffect, useState } from "react";
import api, { submitReview } from "../../services/api";
import ReviewForm from "../../components/ReviewForm";
import UserProfileModal from "../../components/UserProfileModal";
import UserCard from "../../components/UserCard";

export default function DriverMyRides() {
  const [rides, setRides] = useState([]);
  const [err, setErr] = useState("");
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewMeta, setReviewMeta] = useState({});
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileForModal, setProfileForModal] = useState(null);

  useEffect(() => {
    fetchRides();
  }, []);

  const fetchRides = async () => {
    try {
      const { data } = await api.get("/rides/mine");
      setRides(Array.isArray(data) ? data : data ? [data] : []);
      setErr("");
    } catch (e) {
      console.error(e);
      setErr(e?.response?.data?.error || "Failed to load rides");
    }
  };

  const formatDate = (dtStr) => (dtStr ? new Date(dtStr).toLocaleDateString() : "");
  const formatTime = (dtStr) =>
    dtStr ? new Date(dtStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true }) : "";
  const formatCurrency = (amount) => `₹${Number(amount || 0).toFixed(2)}`;

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

  const handleApprove = async (bookingId) => {
    try {
      await api.post(`/bookings/approve/${bookingId}`);
      alert("Booking approved.");
      fetchRides();
    } catch (e) {
      console.error(e);
      alert("Failed to approve booking");
    }
  };

  const handleReject = async (bookingId) => {
    try {
      await api.post(`/bookings/reject/${bookingId}`);
      alert("Booking rejected.");
      fetchRides();
    } catch (e) {
      console.error(e);
      alert("Failed to reject booking");
    }
  };

  const isRideCompleted = (ride) => {
    if (!ride?.departureDatetime) return false;
    return new Date(ride.departureDatetime).getTime() < Date.now();
  };

  const openReviewForPassenger = async (ride, booking) => {
    let revieweeId = booking.passengerId ?? (booking.passenger && (booking.passenger.id ?? null)) ?? null;
    let name = booking.passengerName ?? (booking.passenger && booking.passenger.name) ?? "Passenger";
    const rideId = ride.rideId ?? ride.id ?? null;
    const bookingId = booking.bookingId ?? booking.id ?? null;

    if (!revieweeId && bookingId) {
      try {
        const res = await api.get(`/bookings/${bookingId}`);
        const full = res.data || {};
        revieweeId = full.passengerId ?? (full.passenger && full.passenger.id) ?? revieweeId;
        name = name === "Passenger" ? (full.passengerName ?? (full.passenger && full.passenger.name) ?? name) : name;
      } catch (err) {
        console.debug("[openReviewForPassenger] booking fetch fallback failed", err);
      }
    }

    if (!revieweeId) {
      alert("Cannot open review: passenger information is missing. Please refresh the page or contact support.");
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
      await fetchRides();
      alert("Thanks — your review has been submitted.");
    } catch (err) {
      console.error("Submit review failed", err);
      alert(err?.response?.data?.error || "Failed to submit review");
    }
  };

  const openProfile = (user) => {
    // `user` may be a full profile (if UserCard passed it),
    // or a minimal object {id, name} : we pass as-is to modal which will fetch reviews.
    setProfileForModal(user || null);
    setProfileModalOpen(true);
  };

  return (
    <div className="container py-5">
      <h2 className="mb-4">My Rides</h2>
      {err && <div className="alert alert-danger">{err}</div>}

      {rides.length === 0 ? (
        <div className="alert alert-info">No rides found.</div>
      ) : (
        <div className="space-y-4">
          {rides.map((ride) => {
            const totalRevenue = ride.bookings?.reduce((sum, b) => {
              return sum + (b.totalPrice ? parseFloat(b.totalPrice) : 0);
            }, 0) || 0;

            return (
              <div key={ride.rideId} className="bg-white rounded-xl shadow-sm hover:shadow-md transition overflow-hidden border">
                <div className="px-4 py-3 bg-gradient-to-r from-yellow-50 to-white flex justify-between items-center">
                  <div className="font-semibold text-gray-800">{ride.source} → {ride.destination}</div>
                  <div className="text-sm text-gray-500">Ride ID: {ride.rideId}</div>
                </div>

                <div className="p-4 md:flex md:items-start md:gap-6">
                  <div className="md:w-56 w-full">
                    <div className="text-sm text-gray-600">Departure: {formatDate(ride.departureDatetime)} at {formatTime(ride.departureDatetime)}</div>
                    <div className="text-sm text-gray-600 mt-1">Seats Filled: {ride.bookings?.length ? ride.bookings.reduce((s,b)=>s+(b.seatsBooked||0),0) : 0} / {ride.seatsTotal || 0}</div>
                    <div className="text-lg font-semibold mt-3">Total Revenue: {formatCurrency(totalRevenue)}</div>
                  </div>

                  <div className="flex-1 mt-4 md:mt-0">
                    {ride.bookings && ride.bookings.length > 0 ? (
                      <ul className="list-unstyled space-y-3">
                        {ride.bookings.map((b) => (
                          <li key={b.bookingId} className="p-3 border rounded-lg flex justify-between items-center">
                            <div className="d-flex align-items-center">
                              <div style={{ minWidth: 220 }}>
                                {/* showJoined=true to display passenger "Joined" date */}
                                <UserCard
                                  userId={b.passengerId}
                                  fallbackName={b.passengerName || "Passenger"}
                                  small={true}
                                  showJoined={true}
                                  onClick={(profile) => openProfile(profile || { id: b.passengerId, name: b.passengerName })}
                                />

                                <div className="mt-2">
                                  <button className="btn btn-sm btn-outline-secondary" onClick={() => openProfile({ id: b.passengerId, name: b.passengerName })}>
                                    View profile
                                  </button>
                                </div>
                              </div>
                            </div>

                            <div className="text-right" style={{ minWidth: 240 }}>
                              <div className="mb-2">
                                <strong>{b.seatsBooked} seat(s)</strong> – {b.totalPrice ? formatCurrency(b.totalPrice) : "—"}
                              </div>

                              <div className="mb-2">
                                <span className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold mr-2">{b.bookingStatus}</span>
                                <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold">{b.paymentStatus}{b.paymentMethod ? ` (${b.paymentMethod})` : ""}</span>
                              </div>

                              <div className="flex gap-2 justify-end">
                                {b.bookingStatus === "PENDING" && !b.driverApproved && (
                                  <>
                                    <button className="btn btn-sm btn-primary" onClick={() => handleApprove(b.bookingId)}>Approve</button>
                                    <button className="btn btn-sm btn-danger" onClick={() => handleReject(b.bookingId)}>Reject</button>
                                  </>
                                )}

                                {b.paymentMethod?.toUpperCase() === "CASH" && b.paymentStatus?.toUpperCase() === "PENDING" && (
                                  <button className="btn btn-sm btn-success" onClick={() => handleMarkPaid(b.paymentId)}>Mark as Paid</button>
                                )}

                                {isRideCompleted(ride) && b.bookingStatus === "CONFIRMED" && (
                                  <button className="btn btn-sm btn-outline-primary" onClick={() => openReviewForPassenger(ride, b)}>⭐ Leave Review</button>
                                )}
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>No bookings yet</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
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
