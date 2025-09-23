// src/pages/admin/BookingsTable.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import api from "../../services/api";

export default function BookingsTable() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [query, setQuery] = useState("");
  const [sortField, setSortField] = useState("bookingId");
  const [sortDir, setSortDir] = useState("asc");
  const [page, setPage] = useState(1);
  const pageSize = 8;
  const pollRef = useRef(null);

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

  const fetchBookings = async () => {
    setErr("");
    setLoading(true);
    try {
      const { data } = await api.get("/admin/bookings");
      setBookings(Array.isArray(data) ? data : data ? [data] : []);
    } catch (e) {
      console.error(e);
      setErr(e?.response?.data?.error || "Failed to fetch bookings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
    pollRef.current = setInterval(fetchBookings, 8000);
    return () => clearInterval(pollRef.current);
  }, []);

  const processed = useMemo(() => {
    let list = bookings.slice();
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((b) =>
        (b.passengerName || "").toLowerCase().includes(q) ||
        (b.driverName || "").toLowerCase().includes(q) ||
        (b.source || "").toLowerCase().includes(q) ||
        (b.destination || "").toLowerCase().includes(q)
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
  }, [bookings, query, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(processed.length / pageSize));
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [totalPages, page]);
  const pageItems = useMemo(() => { const start = (page - 1) * pageSize; return processed.slice(start, start + pageSize); }, [processed, page]);

  const getBookingBadge = (status) => {
    switch (status) {
      case "CONFIRMED": return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded bg-green-100 text-green-800">Confirmed</span>;
      case "PENDING": return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded bg-yellow-100 text-yellow-800">Pending</span>;
      case "CANCELLED": return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded bg-red-100 text-red-800">Cancelled</span>;
      default: return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  const getPaymentBadge = (status, method) => {
    if ((status || "").toUpperCase() === "COMPLETED") {
      return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded bg-green-100 text-green-800">Paid{method ? ` (${method})` : ""}</span>;
    }
    return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded bg-red-100 text-red-800">Pending</span>;
  };

  return (
    <div className="p-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-xl font-semibold">Bookings</h3>
          <button onClick={() => { clearInterval(pollRef.current); fetchBookings(); pollRef.current = setInterval(fetchBookings, 8000); }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-gray-100 hover:bg-gray-200 text-sm">⟳ Refresh</button>
          {loading && <span className="text-sm text-gray-500">Loading…</span>}
        </div>

        <div className="flex items-center gap-2">
          <input className="border rounded px-3 py-2 w-56" placeholder="Search passenger / driver / route" value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1); }} />
          <select className="border rounded px-2 py-1" value={sortField} onChange={(e) => setSortField(e.target.value)}>
            <option value="bookingId">ID</option>
            <option value="passengerName">Passenger</option>
            <option value="driverName">Driver</option>
            <option value="departureDatetime">Departure</option>
          </select>
          <button className="border rounded px-2 py-1" onClick={() => setSortDir(d => d === "asc" ? "desc" : "asc")}>{sortDir === "asc" ? "↑" : "↓"}</button>
        </div>
      </div>

      {err && <div className="mb-3 text-red-600">{err}</div>}

      <div className="bg-white shadow rounded overflow-x-auto">
        <table className="min-w-full table-auto">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">ID</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Route</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Passenger</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Driver</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Seats</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Fare</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Departure</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Status</th>
            </tr>
          </thead>

          <tbody>
            {pageItems.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-6 text-center text-sm text-gray-500">No bookings found.</td></tr>
            )}

            {pageItems.map((b) => (
              <tr key={b.bookingId} className="border-t">
                <td className="px-4 py-3 text-sm text-gray-700">{b.bookingId}</td>
                <td className="px-4 py-3 text-sm">
                  <div className="font-medium text-gray-900">{b.source} → {b.destination}</div>
                </td>
                <td className="px-4 py-3 text-sm">{b.passengerName || "-"}</td>
                <td className="px-4 py-3 text-sm">{b.driverName || "-"}</td>
                <td className="px-4 py-3 text-sm">{b.seatsBooked || 0}</td>
                <td className="px-4 py-3 text-sm">₹{Number(b.totalPrice || 0).toFixed(2)}</td>
                <td className="px-4 py-3 text-sm">{formatDateTime(b.departureDatetime)}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <div>{getBookingBadge(b.bookingStatus)}</div>
                    <div>{getPaymentBadge(b.paymentStatus, b.paymentMethod)}</div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
          <div className="text-sm text-gray-600">Showing {pageItems.length} of {processed.length} bookings</div>
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
