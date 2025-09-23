// src/components/ReviewForm.jsx
import { useEffect, useState } from "react";

export default function ReviewForm({ open, onClose, onSubmit, meta = {} }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setRating(5);
      setComment("");
      setError("");
      setSending(false);
    }
  }, [open]);

  if (!open) return null;

  const stars = [1, 2, 3, 4, 5];

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    // Basic client-side validations
    if (!rating || rating < 1 || rating > 5) {
      setError("Please select a rating between 1 and 5.");
      return;
    }

    // Ensure we have a revieweeId to send (frontend guard)
    const revieweeIdRaw = meta?.revieweeId ?? null;
    if (revieweeIdRaw === null || revieweeIdRaw === undefined || revieweeIdRaw === "") {
      setError("revieweeId is required. Please try again or refresh the page.");
      return;
    }

    // Try to coerce to number (backend expects Long)
    const revieweeIdNum = Number(revieweeIdRaw);
    if (Number.isNaN(revieweeIdNum) || !Number.isFinite(revieweeIdNum)) {
      setError("revieweeId is invalid. Please contact support.");
      return;
    }

    const payload = {
      rideId: meta?.rideId != null ? Number(meta.rideId) : null,
      bookingId: meta?.bookingId != null ? Number(meta.bookingId) : null,
      revieweeId: revieweeIdNum,
      rating: Number(rating),
      comment: comment?.trim() || "",
    };

    setSending(true);
    try {
      // Helpful debug log so you can inspect what's actually sent.
      // Remove this line in production if you prefer not to log tokens / payloads.
      /* eslint-disable no-console */
      console.debug("[ReviewForm] submitting review payload:", payload);
      /* eslint-enable no-console */

      // Call the parent's onSubmit (keeps existing design)
      await onSubmit(payload);

      setSending(false);
      onClose();
    } catch (err) {
      console.error("Submit review failed", err);
      // axios style error handling
      const serverMsg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "Failed to submit review";
      setError(serverMsg);
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black opacity-40"
        onClick={() => !sending && onClose()}
        aria-hidden
      />
      <form
        onSubmit={submit}
        className="relative bg-white rounded-lg shadow-xl max-w-lg w-full p-6 z-10"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-semibold">
            {meta.title ?? "Leave a review"}
          </h3>
          <button
            type="button"
            onClick={() => !sending && onClose()}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="mt-4">
          {meta.revieweeName && (
            <div className="text-sm text-gray-600 mb-2">
              For: <strong>{meta.revieweeName}</strong>
            </div>
          )}

          <div className="flex items-center gap-2">
            {stars.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setRating(s)}
                className={`text-2xl leading-none ${s <= rating ? "text-yellow-500" : "text-gray-300"} focus:outline-none`}
                aria-label={`${s} star`}
              >
                ★
              </button>
            ))}
            <div className="text-sm text-gray-600 ml-2">{rating} / 5</div>
          </div>

          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Write an optional comment (helpful feedback)"
            rows={4}
            className="w-full mt-4 border rounded p-3 focus:ring-2 focus:ring-indigo-300"
            disabled={sending}
          />

          {error && <div className="mt-2 text-sm text-red-600">{error}</div>}
        </div>

        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => !sending && onClose()}
            className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200"
            disabled={sending}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={`px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700 ${sending ? "opacity-80" : ""}`}
            disabled={sending}
          >
            {sending ? "Submitting…" : "Submit Review"}
          </button>
        </div>
      </form>
    </div>
  );
}
