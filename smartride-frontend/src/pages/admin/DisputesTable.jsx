// src/pages/admin/DisputesTable.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import api from "../../services/api";

export default function DisputesTable() {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [query, setQuery] = useState("");
  const [sortField, setSortField] = useState("disputeId");
  const [sortDir, setSortDir] = useState("asc");
  const [page, setPage] = useState(1);
  const pageSize = 8;
  const pollRef = useRef(null);

  const fetchDisputes = async () => {
    setErr("");
    setLoading(true);
    try {
      const { data } = await api.get("/admin/disputes");
      setDisputes(Array.isArray(data) ? data : data ? [data] : []);
    } catch (e) {
      console.error(e);
      setErr(e?.response?.data?.error || "Failed to fetch disputes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDisputes(); pollRef.current = setInterval(fetchDisputes, 8000); return () => clearInterval(pollRef.current); }, []);

  const processed = useMemo(() => {
    let list = disputes.slice();
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(d =>
        (String(d.bookingId) || "").includes(q) ||
        (String(d.rideId) || "").includes(q) ||
        (d.passengerName || "").toLowerCase().includes(q) ||
        (d.driverName || "").toLowerCase().includes(q)
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
  }, [disputes, query, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(processed.length / pageSize));
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [totalPages, page]);
  const pageItems = useMemo(() => { const start = (page - 1) * pageSize; return processed.slice(start, start + pageSize); }, [processed, page]);

  return (
    <div className="p-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-xl font-semibold">Disputed Bookings</h3>
          <button onClick={() => { clearInterval(pollRef.current); fetchDisputes(); pollRef.current = setInterval(fetchDisputes, 8000); }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-gray-100 hover:bg-gray-200 text-sm">⟳ Refresh</button>
          {loading && <span className="text-sm text-gray-500">Loading…</span>}
        </div>

        <div className="flex items-center gap-2">
          <input className="border rounded px-3 py-2 w-56" placeholder="Search booking / ride / passenger" value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1); }} />
          <select className="border rounded px-2 py-1" value={sortField} onChange={(e) => setSortField(e.target.value)}>
            <option value="disputeId">ID</option>
            <option value="bookingId">Booking ID</option>
            <option value="status">Status</option>
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
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Booking</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Passenger</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Driver</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Reason</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Status</th>
            </tr>
          </thead>

          <tbody>
            {pageItems.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-500">No disputes found.</td></tr>
            )}

            {pageItems.map((d) => (
              <tr key={d.disputeId} className="border-t">
                <td className="px-4 py-3 text-sm text-gray-700">{d.disputeId}</td>
                <td className="px-4 py-3 text-sm">Booking #{d.bookingId} | Ride #{d.rideId}</td>
                <td className="px-4 py-3 text-sm">{d.passengerName}</td>
                <td className="px-4 py-3 text-sm">{d.driverName}</td>
                <td className="px-4 py-3 text-sm">{d.reason || "—"}</td>
                <td className="px-4 py-3 text-right text-sm">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${d.status === "OPEN" ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"}`}>
                    {d.status || "UNKNOWN"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
          <div className="text-sm text-gray-600">Showing {pageItems.length} of {processed.length} disputes</div>
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
