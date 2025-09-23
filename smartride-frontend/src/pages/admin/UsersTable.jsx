// src/pages/admin/UsersTable.jsx
import { useEffect, useMemo, useState, useRef } from "react";
import api from "../../services/api";

export default function UsersTable() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState({});
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [sortField, setSortField] = useState("id");
  const [sortDir, setSortDir] = useState("asc");
  const [page, setPage] = useState(1);
  const pageSize = 8;
  const pollRef = useRef(null);

  const fetchUsers = async () => {
    setError("");
    setLoading(true);
    try {
      const { data } = await api.get("/admin/users");
      setUsers(Array.isArray(data) ? data : []);
    } catch {
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    pollRef.current = setInterval(fetchUsers, 8000);
    return () => clearInterval(pollRef.current);
  }, []);

  const refreshNow = () => {
    clearInterval(pollRef.current);
    fetchUsers();
    pollRef.current = setInterval(fetchUsers, 8000);
  };

  const doAction = async (fn, id) => {
    setActionLoading((s) => ({ ...s, [id]: true }));
    try {
      await fn(id);
      await fetchUsers();
    } catch {
      setError("Action failed");
    } finally {
      setActionLoading((s) => ({ ...s, [id]: false }));
    }
  };

  const blockUser = (id, name) => {
    if (!window.confirm(`Block user "${name}"?`)) return;
    doAction((userId) => api.put(`/admin/block-user/${userId}`), id);
  };

  const verifyDriver = (id) => {
    if (!window.confirm("Verify this driver?")) return;
    doAction((userId) => api.put(`/admin/verify-driver/${userId}`), id);
  };

  const processed = useMemo(() => {
    let list = users.slice();
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (u) =>
          (u.name || "").toLowerCase().includes(q) ||
          (u.email || "").toLowerCase().includes(q) ||
          (u.role || "").toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      const aVal = (a[sortField] ?? "").toString().toLowerCase();
      const bVal = (b[sortField] ?? "").toString().toLowerCase();
      if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return list;
  }, [users, query, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(processed.length / pageSize));
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return processed.slice(start, start + pageSize);
  }, [processed, page]);

  return (
    <div className="p-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-xl font-semibold">Users</h3>
          <button
            onClick={refreshNow}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-gray-100 hover:bg-gray-200 text-sm"
          >
            ⟳ Refresh
          </button>
          {loading && <span className="text-sm text-gray-500">Loading…</span>}
        </div>

        <div className="flex items-center gap-2">
          <input
            className="border rounded px-3 py-2 w-56"
            placeholder="Search name / email / role"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
          />
          <select
            className="border rounded px-2 py-1"
            value={sortField}
            onChange={(e) => setSortField(e.target.value)}
          >
            <option value="id">ID</option>
            <option value="name">Name</option>
            <option value="email">Email</option>
            <option value="role">Role</option>
          </select>
          <button
            className="border rounded px-2 py-1"
            onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
            title="Toggle sort direction"
          >
            {sortDir === "asc" ? "↑" : "↓"}
          </button>
        </div>
      </div>

      {error && <div className="mb-3 text-red-600">{error}</div>}

      <div className="bg-white shadow rounded overflow-x-auto">
        <table className="min-w-full table-auto">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">ID</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Name</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Email</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Role</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Status</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Actions</th>
            </tr>
          </thead>

          <tbody>
            {pageItems.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-500">
                  No users found.
                </td>
              </tr>
            )}

            {pageItems.map((u) => (
              <tr key={u.id} className="border-t">
                <td className="px-4 py-3 text-sm text-gray-700">{u.id}</td>

                <td className="px-4 py-3">
                  <div className="text-sm font-medium text-gray-900">{u.name}</div>
                  <div className="text-xs text-gray-500">Phone: {u.phone || "—"}</div>
                </td>

                <td className="px-4 py-3 text-sm text-gray-700">{u.email}</td>

                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded ${
                      u.role === "DRIVER" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"
                    }`}
                  >
                    {u.role}
                  </span>
                </td>

                <td className="px-4 py-3">
                  {u.isBlocked ? (
                    <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded bg-red-100 text-red-800">
                      Blocked
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded bg-gray-100 text-gray-800">
                      Active
                    </span>
                  )}
                </td>

                <td className="px-4 py-3 text-right">
                  <div className="inline-flex items-center gap-2">
                    {!u.isBlocked && (
                      <button
                        className="px-3 py-1 rounded bg-red-500 text-white text-sm disabled:opacity-60"
                        disabled={!!actionLoading[u.id]}
                        onClick={() => blockUser(u.id, u.name)}
                      >
                        {actionLoading[u.id] ? "Blocking…" : "Block"}
                      </button>
                    )}

                    {!u.verified && u.role === "DRIVER" && (
                      <button
                        className="px-3 py-1 rounded bg-emerald-600 text-white text-sm disabled:opacity-60"
                        disabled={!!actionLoading[u.id]}
                        onClick={() => verifyDriver(u.id)}
                      >
                        {actionLoading[u.id] ? "Verifying…" : "Verify"}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
          <div className="text-sm text-gray-600">
            Showing {pageItems.length} of {processed.length} users
          </div>

          <div className="flex items-center gap-2">
            <button
              className="px-3 py-1 rounded border disabled:opacity-50"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Prev
            </button>

            <div className="text-sm">
              Page <strong>{page} / {totalPages}</strong>
            </div>

            <button
              className="px-3 py-1 rounded border disabled:opacity-50"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
