// src/components/RatingStars.jsx
import React from "react";

/**
 * Simple star + score display.
 * Hides stars if count is 0 or avg is null/0 (cleaner UI).
 * props:
 *  - avg (number)
 *  - count (number)
 */
export default function RatingStars({ avg, count }) {
  const show = avg != null && count != null && count > 0;
  const rounded = show ? Math.round((avg || 0) * 10) / 10 : 0;

  if (!show) return null;

  // show up to 5 filled stars (visual only)
  const full = Math.round(avg || 0);
  const stars = [1, 2, 3, 4, 5];

  return (
    <div className="d-flex align-items-center gap-2" style={{ whiteSpace: "nowrap" }}>
      <div>
        {stars.map((s) => (
          <span key={s} style={{ color: s <= full ? "#f6c84c" : "#e9ecef", fontSize: 14 }}>
            ★
          </span>
        ))}
      </div>
      <div className="text-muted small">
        {rounded} / 5 {`(${count})`}
      </div>
    </div>
  );
}
