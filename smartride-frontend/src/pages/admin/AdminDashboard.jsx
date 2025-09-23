// src/pages/admin/AdminDashboard.jsx
import { useState, useEffect, useMemo } from "react";
import StatsCards from "./StatsCards";
import UsersTable from "./UsersTable";
import RidesTable from "./RidesTable";
import BookingsTable from "./BookingsTable";
import PaymentsTable from "./PaymentsTable";
import DisputesTable from "./DisputesTable";
import api from "../../services/api";

export default function AdminDashboard() {
  const [stats, setStats] = useState({});
  const [rides, setRides] = useState([]);
  const [activeTab, setActiveTab] = useState("stats");

  // Commission percent applied per ride (frontend constant)
  const commissionPct = 10;

  useEffect(() => {
    fetchStats();
    fetchRides();
  }, []);

  const fetchStats = async () => {
    try {
      const { data } = await api.get("/admin/stats");
      setStats(data || {});
    } catch (err) {
      console.error("Failed to fetch stats:", err);
      setStats({});
    }
  };

  const fetchRides = async () => {
    try {
      const { data } = await api.get("/admin/rides");
      setRides(Array.isArray(data) ? data : data ? [data] : []);
    } catch (err) {
      console.error("Failed to fetch rides:", err);
      setRides([]);
    }
  };

  // Derive ride revenue using same defensive logic used in RidesTable / BookingsTable
  const deriveRideRevenue = (ride) => {
    if (!ride) return 0;

    if (ride.totalRevenue !== undefined && ride.totalRevenue !== null) {
      const v = Number(ride.totalRevenue);
      if (!isNaN(v)) return v;
    }

    if (Array.isArray(ride.bookings) && ride.bookings.length > 0) {
      const sum = ride.bookings.reduce((s, b) => {
        const item = Number(b?.totalPrice ?? b?.amount ?? 0);
        return s + (isNaN(item) ? 0 : item);
      }, 0);
      if (sum !== 0) return sum;
    }

    const fare = Number(ride.fare ?? 0);
    const seats =
      Number(ride.seatsFilled ?? ride.bookedSeats ?? (Array.isArray(ride.bookings) ? ride.bookings.length : 0)) || 0;
    if (!isNaN(fare) && !isNaN(seats) && fare > 0 && seats > 0) {
      return fare * seats;
    }

    return 0;
  };

  // Commission = sum of 10% of each ride's revenue
  const adminCommission = useMemo(() => {
    const total = (rides || []).reduce((acc, r) => {
      const rev = deriveRideRevenue(r);
      return acc + (Number(rev || 0) * (commissionPct / 100));
    }, 0);
    return Number(total || 0);
  }, [rides, commissionPct]);

  const formatINR = (value) => {
    try {
      return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
      }).format(Number(value));
    } catch {
      return `₹${Number(value).toFixed(2)}`;
    }
  };

  const withdrawCommission = async () => {
    if (!window.confirm(`Withdraw commission of ${formatINR(adminCommission)}?`)) return;
    try {
      const { data } = await api.post("/admin/withdraw-commission", { amount: adminCommission });
      const msg = data?.message || "Commission withdrawn successfully";
      alert(`✅ ${msg}`);
      await fetchStats();
      await fetchRides();
    } catch (err) {
      console.error("Withdraw failed:", err);
      const serverMsg = err?.response?.data?.message || err?.response?.data || err.message;
      alert(`❌ Withdraw failed: ${serverMsg}`);
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      {/* Tabs */}
      <div className="flex gap-4 mb-6">
        {["stats", "users", "rides", "bookings", "payments", "disputes"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg font-semibold ${
              activeTab === tab ? "bg-purple-600 text-white" : "bg-white text-gray-700 shadow"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Active Tab Content */}
      <div className="bg-white p-6 rounded-lg shadow">
        {activeTab === "stats" && (
          <>
            <StatsCards stats={stats} />

            {/* Commission card */}
            <div className="mt-6 p-4 bg-white rounded-lg border shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold">Admin Commission</h3>
                <p className="text-sm text-gray-600">Platform commission is {commissionPct}% of each ride’s revenue.</p>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-sm text-gray-500">Available</div>
                  <div className="text-2xl font-bold">{formatINR(adminCommission)}</div>
                </div>

                <button
                  onClick={withdrawCommission}
                  className="px-4 py-2 rounded bg-purple-600 text-white font-semibold hover:bg-purple-700 transition"
                >
                  Withdraw
                </button>
              </div>
            </div>
          </>
        )}

        {activeTab === "users" && <UsersTable />}
        {activeTab === "rides" && <RidesTable />}
        {activeTab === "bookings" && <BookingsTable />}
        {activeTab === "payments" && <PaymentsTable />}
        {activeTab === "disputes" && <DisputesTable />}
      </div>
    </div>
  );
}
