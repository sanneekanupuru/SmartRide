// src/pages/UserProfile.jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api, { fetchUserProfile } from "../services/api";
import RatingStars from "../components/RatingStars";

export default function UserProfile() {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const res = await fetchUserProfile(id);
        setProfile(res.data);
      } catch (e) {
        console.error("Failed to load user profile", e);
        setErr("Failed to load profile");
      }
    };
    load();
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const loadReviews = async () => {
      try {
        const res = await api.get(`/reviews/user/${id}`);
        if (res.data && Array.isArray(res.data.reviews)) {
          setReviews(res.data.reviews);
        } else if (Array.isArray(res.data)) {
          setReviews(res.data);
        }
      } catch (e) {
        // optional, non-fatal
        console.debug("Could not fetch reviews", e);
      }
    };
    loadReviews();
  }, [id]);

  if (err) return <div className="container py-6"><div className="alert alert-danger">{err}</div></div>;
  if (!profile) return <div className="container py-6">Loading...</div>;

  return (
    <div className="container py-6">
      <div className="bg-white rounded-lg shadow p-6 max-w-3xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">{profile.name}</h2>
            <div className="text-sm text-gray-600">{profile.email}</div>
            <div className="text-sm text-gray-600">Role: {profile.role}</div>
            {profile.vehicleModel && <div className="text-sm text-gray-600">Vehicle: {profile.vehicleModel} {profile.licensePlate ? `(${profile.licensePlate})` : ""}</div>}
          </div>
          <div className="text-right">
            <RatingStars avg={profile.avgRating} count={profile.reviewCount} size="md" />
          </div>
        </div>

        <hr className="my-4" />

        <div>
          <h4 className="text-lg font-medium mb-2">About</h4>
          <p className="text-sm text-gray-700">Joined: {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : "—"}</p>
        </div>

        {reviews && reviews.length > 0 && (
          <>
            <hr className="my-4" />
            <div>
              <h4 className="text-lg font-medium mb-2">Recent Reviews</h4>
              <ul className="space-y-3">
                {reviews.map((r) => (
                  <li key={r.id} className="p-3 border rounded">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">User {r.reviewerId ?? "—"}</div>
                      <div className="text-sm text-gray-500">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ""}</div>
                    </div>
                    <div className="mt-2 text-sm">
                      <strong>{r.rating} / 5</strong> — {r.comment || "No comment"}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
