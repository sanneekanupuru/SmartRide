// src/components/UserCard.jsx
import React, { useEffect, useState } from "react";
import { fetchUserProfile } from "../services/api";
import ProfileCard from "./ProfileCard";

/**
 * Small profile card used inside booking/ride lists.
 *
 * Props:
 *   - userId: Long (required) - id to fetch profile for
 *   - fallbackName: string (optional) - shown while loading / if fetch fails
 *   - small: boolean (optional) - render a more compact variant
 *   - showJoined: boolean (optional) - show "Joined: date" under the role if available
 *   - onClick: fn (optional) - called with the loaded profile when user clicks the card
 */
const profileCache = new Map();

export default function UserCard({
  userId,
  fallbackName = "User",
  small = false,
  showJoined = false,
  onClick,
}) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(Boolean(userId));
  const [error, setError] = useState("");

  useEffect(() => {
    if (!userId) {
      setProfile(null);
      setLoading(false);
      setError("No user id");
      return;
    }
    let mounted = true;

    const load = async () => {
      setLoading(true);
      setError("");

      if (profileCache.has(userId)) {
        if (!mounted) return;
        setProfile(profileCache.get(userId));
        setLoading(false);
        return;
      }

      try {
        const res = await fetchUserProfile(userId);
        const data = res?.data ?? null;
        if (mounted) {
          setProfile(data);
          profileCache.set(userId, data);
        }
      } catch (err) {
        console.debug("[UserCard] profile fetch failed", err);
        if (mounted) setError("Failed to load profile");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [userId]);

  // derive values
  const id = profile?.id ?? userId;
  const name = profile?.name ?? fallbackName;
  const role = profile?.role ?? "";
  const avgRating = profile?.avgRating ?? undefined;
  const reviewCount = profile?.reviewCount ?? undefined;
  const avatarColor = profile?.avatarColor ?? undefined;
  const createdAt = profile?.createdAt ?? null;

  const avatarStyle = {
    width: small ? 40 : 56,
    height: small ? 40 : 56,
    borderRadius: "50%",
    background: "#6b46c1",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
    fontWeight: 700,
    marginRight: 12,
    fontSize: small ? 16 : 20,
  };

  const renderStars = (avg, count) => {
    if (!count || count <= 0) {
      return <div className="text-sm text-muted">No ratings yet</div>;
    }
    const filled = Math.round(avg);
    const total = 5;
    const stars = Array.from({ length: total }, (_, i) => i + 1).map((s) => (
      <span key={s} style={{ color: s <= filled ? "#f6c21a" : "#e6e6e6", fontSize: small ? 14 : 16 }}>
        ★
      </span>
    ));
    return (
      <div className="d-flex align-items-center gap-2" style={{ fontSize: small ? 12 : 14 }}>
        <div>{stars}</div>
        <div className="text-muted" style={{ marginLeft: 8 }}>
          {Number(avg).toFixed(1)} / 5 ({count})
        </div>
      </div>
    );
  };

  // while loading show a lightweight placeholder using ProfileCard
  if (loading) {
    return (
      <div
        onClick={() => onClick?.(profile)}
        style={{ cursor: onClick ? "pointer" : "default", display: "flex", alignItems: "center" }}
      >
        <div style={avatarStyle}>{(fallbackName || "U").charAt(0).toUpperCase()}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600 }}>{name}</div>
          <div className="text-muted" style={{ fontSize: small ? 12 : 13 }}>
            ID: {id}
            {role ? ` · ${role}` : ""}
          </div>
          <div className="text-sm text-muted" style={{ marginTop: 6 }}>
            Loading rating…
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        onClick={() => onClick?.(profile)}
        style={{ cursor: onClick ? "pointer" : "default", display: "flex", alignItems: "center" }}
      >
        <div style={avatarStyle}>{(name || "U").charAt(0).toUpperCase()}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600 }}>{name}</div>
          <div className="text-danger" style={{ fontSize: small ? 12 : 13 }}>
            {error}
          </div>
        </div>
      </div>
    );
  }

  // Normal render
  return (
    <div
      onClick={() => onClick?.(profile)}
      style={{ cursor: onClick ? "pointer" : "default", display: "flex", alignItems: "center" }}
    >
      {/* Avatar */}
      <div style={avatarStyle} aria-hidden>
        {name ? name.charAt(0).toUpperCase() : fallbackName.charAt(0).toUpperCase()}
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: small ? 15 : 18 }}>{name}</div>
        <div className="text-muted" style={{ fontSize: small ? 12 : 13 }}>
          ID: {id}
          {role ? ` · ${role}` : ""}
        </div>

        {/* Joined date (optional) */}
        {showJoined && createdAt && (
          <div className="text-muted" style={{ fontSize: small ? 12 : 13, marginTop: 6 }}>
            Joined: {new Date(createdAt).toLocaleDateString()}
          </div>
        )}

        <div className="mt-2">
          {renderStars(avgRating ?? 0, reviewCount ?? 0)}
        </div>
      </div>
    </div>
  );
}
