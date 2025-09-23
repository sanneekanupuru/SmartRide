// src/pages/admin/RidesTable.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import api from "../../services/api";

export default function RidesTable() {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [query, setQuery] = useState("");
  const [sortField, setSortField] = useState("rideId");
  const [sortDir, setSortDir] = useState("asc");
  const [page, setPage] = useState(1);
  const pageSize = 8;
  const pollRef = useRef(null);
  const [actionLoading, setActionLoading] = useState({}); // payment marking etc.

  const formatDateTime = (dtStr) =>
    dtStr
      ? new Date(dtStr).toLocaleDateString() +
        " at " +
        new Date(dtStr).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
      : "-";

  const formatCurrency = (amount) =>
    `₹${Number(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const fetchRides = async () => {
    setErr("");
    setLoading(true);
    try {
      const { data } = await api.get("/admin/rides");
      // backend returns list; keep as array
      setRides(Array.isArray(data) ? data : data ? [data] : []);
    } catch (e) {
      console.error(e);
      setErr(e?.response?.data?.error || "Failed to load rides");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRides();
    pollRef.current = setInterval(fetchRides, 8000);
    return () => clearInterval(pollRef.current);
  }, []);

  const handleMarkPaid = async (paymentId) => {
    if (!window.confirm("Mark this payment as COMPLETED?")) return;
    setActionLoading((s) => ({ ...s, [paymentId]: true }));
    try {
      await api.patch(`/payments/${paymentId}/status?status=COMPLETED`);
      fetchRides();
    } catch (e) {
      console.error(e);
      alert("Failed to update payment status");
    } finally {
      setActionLoading((s) => ({ ...s, [paymentId]: false }));
    }
  };

  // search + sort + paginate similar to UsersTable
  const processed = useMemo(() => {
    let list = rides.slice();

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((r) =>
        (r.source || "").toLowerCase().includes(q) ||
        (r.destination || "").toLowerCase().includes(q) ||
        (r.driverName || "").toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      const aVal = ((a[sortField] ?? "") + "").toString().toLowerCase();
      const bVal = ((b[sortField] ?? "") + "").toString().toLowerCase();
      if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return list;
  }, [rides, query, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(processed.length / pageSize));
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [totalPages, page]);

  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return processed.slice(start, start + pageSize);
  }, [processed, page]);

  return (
    <div className="p-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-xl font-semibold">Rides</h3>
          <button
            onClick={() => { clearInterval(pollRef.current); fetchRides(); pollRef.current = setInterval(fetchRides, 8000); }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-gray-100 hover:bg-gray-200 text-sm"
          >
            ⟳ Refresh
          </button>
          {loading && <span className="text-sm text-gray-500">Loading…</span>}
        </div>

        <div className="flex items-center gap-2">
          <input
            className="border rounded px-3 py-2 w-56"
            placeholder="Search source / destination / driver"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1); }}
          />
          <select className="border rounded px-2 py-1" value={sortField} onChange={(e) => setSortField(e.target.value)}>
            <option value="rideId">ID</option>
            <option value="source">Source</option>
            <option value="destination">Destination</option>
            <option value="departureDatetime">Departure</option>
          </select>
          <button className="border rounded px-2 py-1" onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}>
            {sortDir === "asc" ? "↑" : "↓"}
          </button>
        </div>
      </div>

      {err && <div className="mb-3 text-red-600">{err}</div>}

      <div className="bg-white shadow rounded overflow-x-auto">
        <table className="min-w-full table-auto">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">ID</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Route</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Driver</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Departure</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Seats</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Revenue</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Actions</th>
            </tr>
          </thead>

          <tbody>
            {pageItems.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-sm text-gray-500">No rides found.</td>
              </tr>
            )}

            {pageItems.map((ride) => {
              const totalSeatsBooked = (ride.bookings || []).reduce((s, b) => s + (b.seatsBooked || 0), 0);
              const totalRevenue = (ride.bookings || []).reduce((s, b) => s + (b.totalPrice ? parseFloat(b.totalPrice) : 0), 0);
              return (
                <tr key={ride.rideId} className="border-t">
                  <td className="px-4 py-3 text-sm text-gray-700">{ride.rideId}</td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-gray-900">{ride.source} → {ride.destination}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{ride.driverName || "-"}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{formatDateTime(ride.departureDatetime)}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{totalSeatsBooked} / {ride.seatsTotal || 0}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{formatCurrency(totalRevenue)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-2">
                      {/* Expand bookings in-page or direct to bookings tab - keep a simple "View" link here */}
                      <button
                        className="px-3 py-1 rounded bg-gray-100 text-sm"
                        onClick={() => {
                          // quick expand: show alert with booking list (non-intrusive)
                          const details = (ride.bookings || []).map(b => `${b.passengerName} — ${b.seatsBooked} seats — ${formatCurrency(b.totalPrice || 0)} (${b.paymentStatus || 'PENDING'})`).join("\n") || "No bookings";
                          alert(`Bookings for ride ${ride.rideId}:\n\n${details}`);
                        }}
                        title="View bookings"
                      >
                        View
                      </button>
                      {/* If any booking has pending CASH payment, show Mark as Paid (use paymentId of that booking) */}
                      {(ride.bookings || []).some(b => b.paymentMethod?.toUpperCase() === "CASH" && (b.paymentStatus || "").toUpperCase() === "PENDING") && (
                        <button
                          className="px-3 py-1 rounded bg-emerald-600 text-white text-sm"
                          onClick={() => {
                            // pick first pending CASH payment
                            const b = (ride.bookings || []).find(x => x.paymentMethod?.toUpperCase() === "CASH" && (x.paymentStatus || "").toUpperCase() === "PENDING");
                            if (b && b.paymentId) handleMarkPaid(b.paymentId);
                          }}
                          disabled={!!actionLoading[ride.rideId]}
                        >
                          {actionLoading[ride.rideId] ? "Updating…" : "Mark Paid"}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
          <div className="text-sm text-gray-600">Showing {pageItems.length} of {processed.length} rides</div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1 rounded border disabled:opacity-50" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Prev</button>
            <div className="text-sm">Page <strong>{page} / {totalPages}</strong></div>
            <button className="px-3 py-1 rounded border disabled:opacity-50" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
