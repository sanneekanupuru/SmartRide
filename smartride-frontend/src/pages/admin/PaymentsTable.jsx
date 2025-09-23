// src/pages/admin/PaymentsTable.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import api from "../../services/api";

export default function PaymentsTable() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [query, setQuery] = useState("");
  const [sortField, setSortField] = useState("paymentId");
  const [sortDir, setSortDir] = useState("asc");
  const [page, setPage] = useState(1);
  const pageSize = 8;
  const pollRef = useRef(null);
  const [actionLoading, setActionLoading] = useState({});

  const fetchPayments = async () => {
    setErr("");
    setLoading(true);
    try {
      const { data } = await api.get("/admin/payments");
      setPayments(Array.isArray(data) ? data : data ? [data] : []);
    } catch (e) {
      console.error(e);
      setErr(e?.response?.data || "Failed to fetch payments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
    pollRef.current = setInterval(fetchPayments, 8000);
    return () => clearInterval(pollRef.current);
  }, []);

  const handleMarkPaid = async (paymentId) => {
    if (!window.confirm("Mark this payment as COMPLETED?")) return;
    setActionLoading(s => ({ ...s, [paymentId]: true }));
    try {
      await api.patch(`/admin/payments/${paymentId}/status?status=COMPLETED`);
      await fetchPayments();
    } catch (e) {
      console.error(e);
      alert("Failed to update payment status");
    } finally {
      setActionLoading(s => ({ ...s, [paymentId]: false }));
    }
  };

  const processed = useMemo(() => {
    let list = payments.slice();
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(p =>
        (p.passengerName || "").toLowerCase().includes(q) ||
        (p.driverName || "").toLowerCase().includes(q) ||
        (String(p.paymentId) || "").includes(q)
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
  }, [payments, query, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(processed.length / pageSize));
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [totalPages, page]);
  const pageItems = useMemo(() => { const start = (page - 1) * pageSize; return processed.slice(start, start + pageSize); }, [processed, page]);

  const formatCurrency = (amt) => `₹${Number(amt || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="p-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-xl font-semibold">Payments</h3>
          <button onClick={() => { clearInterval(pollRef.current); fetchPayments(); pollRef.current = setInterval(fetchPayments, 8000); }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-gray-100 hover:bg-gray-200 text-sm">⟳ Refresh</button>
          {loading && <span className="text-sm text-gray-500">Loading…</span>}
        </div>

        <div className="flex items-center gap-2">
          <input className="border rounded px-3 py-2 w-56" placeholder="Search passenger / driver / id" value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1); }} />
          <select className="border rounded px-2 py-1" value={sortField} onChange={(e) => setSortField(e.target.value)}>
            <option value="paymentId">ID</option>
            <option value="amount">Amount</option>
            <option value="createdAt">Created</option>
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
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Amount</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Method</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Status / Actions</th>
            </tr>
          </thead>

          <tbody>
            {pageItems.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-sm text-gray-500">No payments found.</td></tr>
            )}

            {pageItems.map((p) => (
              <tr key={p.paymentId} className="border-t">
                <td className="px-4 py-3 text-sm text-gray-700">{p.paymentId}</td>
                <td className="px-4 py-3 text-sm">#{p.bookingId}</td>
                <td className="px-4 py-3 text-sm">{p.passengerName || "Unknown"}</td>
                <td className="px-4 py-3 text-sm">{p.driverName || "Unknown"}</td>
                <td className="px-4 py-3 text-sm font-semibold">{formatCurrency(p.amount)}</td>
                <td className="px-4 py-3 text-sm">{p.paymentMethod || "Unknown"}</td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex items-center gap-3">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${String(p.paymentStatus || "").toLowerCase() === "completed" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                      {String(p.paymentStatus || "PENDING")}
                    </span>

                    {p.paymentMethod?.toUpperCase() === "CASH" && String(p.paymentStatus || "").toLowerCase() !== "completed" && (
                      <button
                        className="px-3 py-1 rounded bg-emerald-600 text-white text-sm"
                        onClick={() => handleMarkPaid(p.paymentId)}
                        disabled={!!actionLoading[p.paymentId]}
                      >
                        {actionLoading[p.paymentId] ? "Updating…" : "Mark Paid"}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
          <div className="text-sm text-gray-600">Showing {pageItems.length} of {processed.length} payments</div>
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
