// src/components/ProfileCard.jsx
import React from "react";
import RatingStars from "./RatingStars";

/**
 * Compact profile card used inside ride/booking cards.
 * Props:
 *  - id (number)
 *  - name (string)
 *  - role (string) 'DRIVER'|'PASSENGER' etc
 *  - avgRating (number) nullable
 *  - reviewCount (number) nullable
 *  - avatarColor (string) optional hex or bg class (we compute from name by default)
 */
export default function ProfileCard({
  id,
  name,
  role,
  avgRating,
  reviewCount,
  avatarColor,
}) {
  const initials = (name || "U")
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // simple deterministic color pick fallback
  const bg = avatarColor || [
    "bg-primary",
    "bg-success",
    "bg-warning",
    "bg-info",
    "bg-secondary",
    "bg-dark",
  ][(name?.charCodeAt(0) || 0) % 6];

  return (
    <div className="d-flex align-items-start gap-3">
      <div
        className={`rounded-circle text-white d-flex align-items-center justify-content-center`}
        style={{
          width: 56,
          height: 56,
          fontWeight: 700,
          fontSize: 18,
          flexShrink: 0,
          background:
            avatarColor && avatarColor.startsWith("#")
              ? avatarColor
              : undefined,
        }}
        // for bootstrap bg-* class if color isn't hex
        {...(avatarColor && !avatarColor.startsWith("#")
          ? { className: `rounded-circle text-white d-flex align-items-center justify-content-center ${bg}` }
          : {})}
      >
        {!avatarColor || avatarColor.startsWith("#") ? initials : initials}
      </div>

      <div className="flex-grow-1">
        <div style={{ fontWeight: 600 }}>{name || "Unknown"}</div>
        <div className="text-muted small">
          ID: {id ?? "—"} · {role ?? "User"}
        </div>

        <div className="mt-2">
          <RatingStars avg={avgRating} count={reviewCount} />
        </div>
      </div>
    </div>
  );
}
