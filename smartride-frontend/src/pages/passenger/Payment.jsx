import React, { useEffect, useState } from "react";
import api from "../../services/api";
import { useParams, useNavigate } from "react-router-dom";

const PassengerPayment = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [message, setMessage] = useState("");

  // extra fields per method
  const [upiId, setUpiId] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [walletProvider, setWalletProvider] = useState("");
  const [walletMobile, setWalletMobile] = useState("");

  // --- Fetch booking + calculated fare ---
  useEffect(() => {
    if (!bookingId) {
      setMessage("Booking ID missing.");
      setLoading(false);
      return;
    }

    const fetchBookingWithFare = async () => {
      try {
        // Fetch booking details
        const resBooking = await api.get(`/bookings/${bookingId}`);
        const bookingData = resBooking.data;

        // Fetch dynamically calculated fare
        const resFare = await api.get(`/payments/estimate/${bookingId}`);
        const dynamicFare = resFare.data.totalFare;

        // Merge dynamic fare into booking object
        setBooking({ ...bookingData, totalPrice: dynamicFare });
      } catch (err) {
        console.error("Error fetching booking or fare:", err);
        setMessage("Failed to fetch booking or fare details.");
      } finally {
        setLoading(false);
      }
    };

    fetchBookingWithFare();
  }, [bookingId]);

  const handlePayment = async () => {
    if (!booking) return;

    // local guard (backend enforces this too)
    if (!booking.driverApproved) {
      setMessage("Driver has not approved this booking yet. Please wait.");
      return;
    }

    try {
      const res = await api.post(
        `/payments/pay/${booking.bookingId}?paymentMethodStr=${paymentMethod.toUpperCase()}`
      );

      const paidAmount = booking.totalPrice; // always use calculated fare

      if (paymentMethod === "CASH") {
        setMessage(
          `✅ Booking confirmed! Please pay the driver in cash at ride time. Payment amount: ₹${paidAmount.toFixed(
            2
          )}. Payment status will remain Pending until the driver confirms.`
        );
      } else {
        setMessage(`✅ Payment successful! Amount: ₹${paidAmount.toFixed(2)}`);
      }

      // redirect after 2 sec
      setTimeout(() => navigate("/passenger/dashboard"), 2000);
    } catch (err) {
      console.error("Payment failed:", err);
      const errMsg = err?.response?.data?.error || "Payment failed. Try again.";
      setMessage(`❌ ${errMsg}`);
    }
  };

  const formatDate = (dateStr) =>
    dateStr ? new Date(dateStr).toLocaleDateString() : "";

  const formatTime = (dateStr) =>
    dateStr
      ? new Date(dateStr).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
      : "";

  if (loading) {
    return (
      <p className="text-center mt-6 text-gray-500">Loading booking details...</p>
    );
  }

  if (!booking) {
    return <p className="text-center mt-6 text-red-500">{message}</p>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 text-center">
          Payment for Booking #{booking.bookingId}
        </h2>

        {/* Booking Info */}
        <div className="bg-blue-50 text-blue-800 rounded-lg p-4 mb-4">
          <p>
            <strong>Route:</strong> {booking.source} → {booking.destination}
          </p>
          <p>
            <strong>Driver:</strong> {booking.driverName}
          </p>
          <p>
            <strong>Seats Booked:</strong> {booking.seatsBooked}
          </p>
          <p className="font-bold">
            <strong>Total Fare:</strong> ₹{booking.totalPrice.toFixed(2)}
          </p>
          <p>
            <strong>Departure:</strong> {formatDate(booking.departureDatetime)} at{" "}
            {formatTime(booking.departureDatetime)}
          </p>
          <p>
            <strong>Booking Status:</strong> {booking.bookingStatus} |{" "}
            <strong>Payment Status:</strong> {booking.paymentStatus}
          </p>
        </div>

        {/* Driver approval notice */}
        {!booking.driverApproved && (
          <div className="mb-4 alert alert-info small">
            Your booking request is awaiting driver approval. You will be notified when the driver approves.
          </div>
        )}

        {/* Payment Method */}
        {booking.paymentStatus !== "COMPLETED" && (
          <>
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Select Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                disabled={!booking.driverApproved} // prevent choosing until approved for clarity
              >
                <option value="CASH">Cash</option>
                <option value="UPI">UPI</option>
                <option value="CREDIT">Credit</option>
                <option value="WALLET">Wallet</option>
              </select>
            </div>

            {/* Extra fields depending on method */}
            {paymentMethod === "UPI" && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  UPI ID
                </label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="e.g. user@upi"
                  className="w-full border border-gray-300 rounded-lg p-3"
                  disabled={!booking.driverApproved}
                />
              </div>
            )}

            {paymentMethod === "CREDIT" && (
              <div className="space-y-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    Card Number
                  </label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="1234 5678 9012 3456"
                    className="w-full border border-gray-300 rounded-lg p-3"
                    disabled={!booking.driverApproved}
                  />
                </div>
                <div className="flex space-x-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-2 text-gray-700">
                      Expiry Date
                    </label>
                    <input
                      type="text"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      placeholder="MM/YY"
                      className="w-full border border-gray-300 rounded-lg p-3"
                      disabled={!booking.driverApproved}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-2 text-gray-700">
                      CVV
                    </label>
                    <input
                      type="password"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value)}
                      placeholder="123"
                      className="w-full border border-gray-300 rounded-lg p-3"
                      disabled={!booking.driverApproved}
                    />
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === "WALLET" && (
              <div className="space-y-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    Wallet Provider
                  </label>
                  <input
                    type="text"
                    value={walletProvider}
                    onChange={(e) => setWalletProvider(e.target.value)}
                    placeholder="Paytm, PhonePe..."
                    className="w-full border border-gray-300 rounded-lg p-3"
                    disabled={!booking.driverApproved}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    Mobile Number
                  </label>
                  <input
                    type="text"
                    value={walletMobile}
                    onChange={(e) => setWalletMobile(e.target.value)}
                    placeholder="9876543210"
                    className="w-full border border-gray-300 rounded-lg p-3"
                    disabled={!booking.driverApproved}
                  />
                </div>
              </div>
            )}

            {paymentMethod === "CASH" && (
              <p className="mb-4 text-sm text-gray-600">
                💵 Please pay directly to the driver at the time of the ride.
              </p>
            )}

            <button
              onClick={handlePayment}
              className="w-full bg-yellow-400 text-gray-900 font-bold py-3 rounded-lg shadow hover:bg-yellow-500 transition"
              disabled={!booking.driverApproved}
            >
              Pay Now
            </button>
          </>
        )}

        {message && (
          <p className="mt-6 text-center text-sm font-medium text-gray-700">
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

export default PassengerPayment;
