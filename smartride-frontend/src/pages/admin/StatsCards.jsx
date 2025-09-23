// src/pages/admin/StatsCards.jsx
import {
  Users,
  UserCheck,
  Car,
  ClipboardList,
  CreditCard,
  DollarSign,
  XCircle,
  AlertTriangle,
} from "lucide-react";

export default function StatsCards({ stats = {} }) {
  const totalEarningsRaw = Number(stats.totalEarnings ?? 0);

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

  const cards = [
    { label: "Total Users", value: stats.totalUsers || 0, color: "bg-blue-500", icon: <Users size={20} /> },
    { label: "Active Users", value: stats.activeUsers || 0, color: "bg-green-500", icon: <UserCheck size={20} /> },
    { label: "Total Rides", value: stats.totalRides || 0, color: "bg-indigo-500", icon: <Car size={20} /> },
    { label: "Total Bookings", value: stats.totalBookings || 0, color: "bg-orange-500", icon: <ClipboardList size={20} /> },
    { label: "Total Payments", value: stats.totalPayments || 0, color: "bg-emerald-500", icon: <CreditCard size={20} /> },
    { label: "Total Earnings", value: formatINR(totalEarningsRaw), color: "bg-yellow-500", icon: <DollarSign size={20} /> },
    // Admin commission intentionally removed from the grid (moved to separate panel in AdminDashboard)
    { label: "Cancelled Bookings", value: stats.cancelledBookings || 0, color: "bg-red-500", icon: <XCircle size={20} /> },
    { label: "Disputed Bookings", value: stats.disputedBookings || 0, color: "bg-pink-500", icon: <AlertTriangle size={20} /> },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`${card.color} text-white p-6 rounded-xl shadow flex flex-col justify-between`}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">{card.label}</h3>
            {card.icon}
          </div>
          <p className="text-3xl font-bold mt-3">{card.value}</p>
        </div>
      ))}
    </div>
  );
}
