// src/components/ProfileLink.jsx
import React, { useState } from "react";
import api, { fetchUserProfile } from "../services/api";

/**
 * ProfileLink
 * - id: user id (required)
 * - name: display name
 * - avgRating, reviewCount: optional quick display values
 *
 * Clicking the name opens a compact modal with the user's public profile
 * (fetched lazily). This avoids navigating away from the current page.
 */
export default function ProfileLink({ id, name = "User", avgRating = 0, reviewCount = 0, className = "" }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");

  const openModal = async (e) => {
    e.preventDefault();
    if (!id) return;

    setError("");
    setOpen(true);

    // if already loaded, skip fetch
    if (profile && profile.id === id) return;

    setLoading(true);
    try {
      // fetch user profile DTO
      const res = await fetchUserProfile(id);
      setProfile(res.data);
    } catch (err) {
      console.error("Failed to load profile", err);
      setError("Failed to load profile. Try refreshing the page.");
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setOpen(false);
    // keep profile in memory (fast subsequent opens)
  };

  const rounded = Number.isFinite(avgRating) ? Number(avgRating).toFixed(1) : "0.0";
  const filled = Math.round(avgRating || 0);

  return (
    <>
      <button
        onClick={openModal}
        className={`d-inline-flex align-items-center gap-2 text-decoration-none bg-transparent border-0 p-0 ${className}`}
        style={{ cursor: id ? "pointer" : "default" }}
        title={`View profile of ${name}`}
      >
        <span className="fw-semibold" style={{ color: "#111" }}>{name}</span>

        <span className="ms-2 d-inline-flex align-items-center" aria-hidden>
          {[1,2,3,4,5].map(s => (
            <span key={s} style={{ color: s <= filled ? "#f6c90e" : "#e6e6e6", fontSize: 14 }}>★</span>
          ))}
        </span>

        <small className="text-muted ms-2" style={{ fontSize: 12 }}>
          {rounded} / 5 {reviewCount ? `(${reviewCount})` : ""}
        </small>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black opacity-40"
            onClick={closeModal}
            aria-hidden
          />

          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-5 z-10">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-1">{profile?.name ?? name}</h3>
                <div className="text-sm text-gray-600">{profile?.email ?? ""}</div>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="mt-3">
              {loading ? (
                <div className="text-sm text-gray-500">Loading...</div>
              ) : error ? (
                <div className="text-sm text-danger">{error}</div>
              ) : profile ? (
                <>
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <div>
                      <div style={{ display: "inline-flex", gap: 4, alignItems: "center" }}>
                        {[1,2,3,4,5].map(s => (
                          <span key={s} style={{ color: s <= Math.round(profile.avgRating || 0) ? "#f6c90e" : "#e6e6e6", fontSize: 16 }}>★</span>
                        ))}
                        <span className="ms-2 text-muted" style={{ fontSize: 13 }}>
                          {(profile.avgRating ?? 0).toFixed(1)} / 5
                        </span>
                      </div>
                      <div className="text-muted small mt-1">{profile.reviewCount ?? 0} review(s)</div>
                    </div>

                    <div className="text-end small text-muted">
                      <div>{profile.role ?? ""}</div>
                      <div className="mt-1">Joined: {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : "—"}</div>
                    </div>
                  </div>

                  {profile.role === "DRIVER" && (profile.vehicleModel || profile.licensePlate) && (
                    <div className="mb-3">
                      <div className="text-sm text-muted">Vehicle</div>
                      <div className="fw-medium">{profile.vehicleModel ?? "—"} {profile.licensePlate ? `(${profile.licensePlate})` : ""}</div>
                    </div>
                  )}

                  {/* Optionally show a few recent reviews if backend returns them in profile (not implemented in DTO currently).
                      If you later add reviews to /api/v1/users/{id}, render them here. */}
                  <div>
                    <h5 className="text-sm fw-semibold mb-2">Recent Reviews</h5>
                    {/* If you add `reviews` to the user profile response, map them below.
                        For now show helpful fallback */}
                    <div className="text-sm text-muted">Open full profile for detailed reviews.</div>
                  </div>
                </>
              ) : (
                <div className="text-sm text-gray-500">No profile data</div>
              )}
            </div>

            <div className="mt-4 text-end">
              <button onClick={closeModal} className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
