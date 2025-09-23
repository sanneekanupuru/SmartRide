// src/components/UserProfileModal.jsx
import { useEffect, useState } from "react";
import api, { fetchUserProfile } from "../services/api";
import ProfileCard from "./ProfileCard";
import RatingStars from "./RatingStars";

/**
 * UserProfileModal
 *
 * - Props:
 *   - open: boolean
 *   - onClose: fn
 *   - profile: object (may be partial, e.g. {id, name}) OR full UserProfileDTO
 *
 * Behavior:
 * - If provided `profile` contains full fields (createdAt etc) we show immediately.
 * - Otherwise we fetch full profile from /api/v1/users/{id} when modal opens.
 * - We fetch reviews from /api/v1/reviews/user/{userId}. If a review lacks reviewerName,
 *   we'll fetch reviewer profile(s) and merge names (simple in-memory cache prevents duplicates).
 */

const reviewerProfileCache = new Map(); // session cache for reviewer profiles

function computeInitials(name) {
  if (!name) return "U";
  return (name || "U")
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function avatarBackgroundForName(name) {
  const colors = ["#3b82f6", "#10b981", "#f59e0b", "#06b6d4", "#6b7280", "#111827"];
  const char = name && name.length ? name.charCodeAt(0) : 0;
  return colors[char % colors.length];
}

export default function UserProfileModal({ open, onClose, profile }) {
  const [freshProfile, setFreshProfile] = useState(profile || null);
  const [reviews, setReviews] = useState([]);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [errProfile, setErrProfile] = useState("");
  const [errReviews, setErrReviews] = useState("");

  // keep local copy of provided profile in sync
  useEffect(() => setFreshProfile(profile || null), [profile]);

  // When modal opens, ensure we have a full profile (fetch if needed).
  useEffect(() => {
    if (!open) return;
    const userId = freshProfile?.id ?? profile?.id ?? null;
    if (!userId) return;

    let mounted = true;
    const loadProfileIfNeeded = async () => {
      // If freshProfile already contains createdAt/email/vehicleModel we consider it "full"
      if (freshProfile && (freshProfile.createdAt || freshProfile.email || freshProfile.vehicleModel)) {
        return;
      }

      setLoadingProfile(true);
      setErrProfile("");
      try {
        const res = await fetchUserProfile(userId);
        if (!mounted) return;
        const data = res?.data ?? null;
        if (data) setFreshProfile((p) => ({ ...(p || {}), ...data }));
      } catch (e) {
        console.error("[UserProfileModal] failed to fetch profile", e);
        if (mounted) setErrProfile("Failed to load profile");
      } finally {
        if (mounted) setLoadingProfile(false);
      }
    };

    loadProfileIfNeeded();
    return () => (mounted = false);
  }, [open, freshProfile?.id, profile?.id]);

  // Load reviews when modal opens & we have a user id; then resolve missing reviewer names
  useEffect(() => {
    if (!open) {
      setReviews([]);
      setErrReviews("");
      setLoadingReviews(false);
      return;
    }
    const userId = freshProfile?.id ?? profile?.id ?? null;
    if (!userId) return;

    let mounted = true;
    const loadReviews = async () => {
      setLoadingReviews(true);
      setErrReviews("");
      try {
        const res = await api.get(`/reviews/user/${userId}`);
        if (!mounted) return;
        const payload = res?.data ?? {};
        const fetched = Array.isArray(payload.reviews) ? payload.reviews : [];

        // Merge avg/reviewCount into freshProfile if backend provided them
        if (payload.avgRating !== undefined || payload.reviewCount !== undefined) {
          setFreshProfile((p) => ({
            ...(p || {}),
            avgRating: payload.avgRating ?? p?.avgRating,
            reviewCount: payload.reviewCount ?? p?.reviewCount,
          }));
        }

        // set reviews early
        setReviews(fetched);

        // find reviewer IDs missing names
        const toFetchIds = Array.from(new Set(
          fetched.filter(r => !r.reviewerName && r.reviewerId).map(r => r.reviewerId)
        ));

        if (toFetchIds.length === 0) {
          setLoadingReviews(false);
          return;
        }

        const promises = toFetchIds.map(async (rid) => {
          if (reviewerProfileCache.has(rid)) return { id: rid, profile: reviewerProfileCache.get(rid) };
          try {
            const resp = await fetchUserProfile(rid);
            const prof = resp?.data ?? null;
            if (prof) reviewerProfileCache.set(rid, prof);
            return { id: rid, profile: prof };
          } catch (e) {
            console.debug(`[UserProfileModal] failed to fetch reviewer ${rid}`, e);
            return { id: rid, profile: null };
          }
        });

        const resolved = await Promise.all(promises);
        if (!mounted) return;
        const idToProfile = new Map(resolved.map(r => [r.id, r.profile]));

        // Merge reviewer names into reviews
        setReviews(current => current.map(r => {
          if (r.reviewerName || r.reviewerEmail) return r;
          const prof = idToProfile.get(r.reviewerId);
          if (!prof) return r;
          return { ...r, reviewerName: prof.name || r.reviewerName, reviewerEmail: prof.email || r.reviewerEmail };
        }));

      } catch (e) {
        console.error("[UserProfileModal] failed to load reviews", e);
        if (mounted) setErrReviews("Failed to load reviews");
      } finally {
        if (mounted) setLoadingReviews(false);
      }
    };

    loadReviews();
    return () => (mounted = false);
  }, [open, freshProfile?.id, profile?.id]);

  if (!open) return null;

  const displayName = freshProfile?.name || freshProfile?.email || "Unknown";
  const avg = Number(freshProfile?.avgRating || 0);
  const count = Number(freshProfile?.reviewCount || 0);
  const initials = computeInitials(displayName);
  const avatarBg = avatarBackgroundForName(displayName);

  const formatDate = (dt) => (dt ? new Date(dt).toLocaleDateString() : "—");

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4">
      <div
        className="absolute inset-0 bg-black opacity-40"
        onClick={() => onClose?.()}
        aria-hidden
      />
      <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 z-10">
        {/* Header area with avatar + summary */}
        <div className="flex items-start justify-between gap-4">
          <div className="d-flex align-items-center" style={{ minWidth: 0 }}>
            {/* Avatar circle (larger) */}
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                background: avatarBg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontWeight: 700,
                fontSize: 26,
                marginRight: 16,
                flexShrink: 0
              }}
              aria-hidden
            >
              {initials}
            </div>

            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 20, fontWeight: 700 }}>{displayName}</div>
              <div className="text-muted small">{freshProfile?.email}</div>
              <div className="mt-2">
                <RatingStars avg={avg} count={count} />
              </div>
            </div>
          </div>

          <div className="text-right" style={{ minWidth: 120 }}>
            <div className="text-muted small mb-2">ID: {freshProfile?.id ?? "—"} · {freshProfile?.role ?? "User"}</div>
            <button
              onClick={() => onClose?.()}
              className="mt-2 px-3 py-2 bg-gray-100 rounded hover:bg-gray-200"
            >
              Close
            </button>
          </div>
        </div>

        <hr className="my-4" />

        <section className="mb-4">
          <h3 className="text-lg font-medium mb-2">About</h3>
          <div className="text-sm text-gray-700">
            {freshProfile?.bio || "This user has not provided additional details."}
          </div>

          <div className="mt-3 text-sm text-gray-600">
            <div><strong>Joined:</strong> {freshProfile?.createdAt ? new Date(freshProfile.createdAt).toLocaleDateString() : "—"}</div>
            {freshProfile?.role === "DRIVER" && (
              <div><strong>Vehicle:</strong> {freshProfile?.vehicleModel ? `${freshProfile.vehicleModel} (${freshProfile.licensePlate || "—"})` : "—"}</div>
            )}
          </div>
        </section>

        <hr className="my-4" />

        <section>
          <h3 className="text-lg font-medium mb-3">Recent Reviews</h3>

          {loadingReviews && <div className="text-sm text-gray-400">Loading reviews…</div>}
          {errReviews && <div className="text-sm text-red-500">{errReviews}</div>}

          {!loadingReviews && reviews.length === 0 && !errReviews && (
            <div className="text-sm text-gray-500">No reviews yet.</div>
          )}

          <div className="space-y-3">
            {reviews.map((r) => (
              <div key={r.id} className="p-3 border rounded-lg bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">
                    {r.reviewerName || r.reviewerEmail || (r.reviewerId ? `User ${r.reviewerId}` : "Anonymous")}
                  </div>
                  <div className="text-xs text-gray-500">{formatDate(r.createdAt)}</div>
                </div>

                <div className="mt-1 text-sm font-semibold text-yellow-500">
                  {"★".repeat(Math.round(r.rating || 0))}{" "}
                  <span className="text-gray-700 ml-2">{r.rating} / 5</span>
                </div>

                {r.comment && <div className="mt-2 text-sm text-gray-700">{r.comment}</div>}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
