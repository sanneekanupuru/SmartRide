import React from "react";
import { Link } from "react-router-dom";

export default function DriverDashboard() {
  return (
    <div className="container-fluid py-5" style={{ maxWidth: 1200 }}>
      {/* Hero */}
      <div className="mb-5">
        <h1 style={{ fontSize: 48, fontWeight: 800, marginBottom: 8 }}>Driver Dashboard</h1>
        <p className="text-muted" style={{ fontSize: 16, marginBottom: 0 }}>
          Post rides, manage passengers, and track earnings — all from one place.
        </p>
      </div>

      {/* Cards */}
      <div className="row g-4">
        <div className="col-12">
          <div className="card shadow-sm rounded-3 border-0">
            <div className="card-body d-flex align-items-center justify-content-between" style={{ gap: 20 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h4 style={{ fontWeight: 700, marginBottom: 6 }}>Post a Ride</h4>
                <p className="text-muted mb-0">
                  Share available seats on your trip — add vehicle details, route, departure time and seat price to start receiving requests.
                </p>
              </div>

              <div style={{ width: 300, textAlign: "right" }}>
                <Link to="/driver/post" className="btn btn-dark btn-lg w-100" style={{ fontSize: 18 }}>
                  🚗 Post Ride
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12">
          <div className="card shadow-sm rounded-3 border-0">
            <div className="card-body d-flex align-items-center justify-content-between" style={{ gap: 20 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h4 style={{ fontWeight: 700, marginBottom: 6 }}>My Rides</h4>
                <p className="text-muted mb-0">
                  Manage your posted rides, approve/reject requests, view earnings and passenger details.
                </p>
              </div>

              <div style={{ width: 300, textAlign: "right" }}>
                <Link to="/driver/rides" className="btn btn-outline-dark btn-lg w-100" style={{ fontSize: 18 }}>
                  📋 View My Rides
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
