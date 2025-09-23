import React from "react";
import { Link } from "react-router-dom";

export default function PassengerDashboard() {
  return (
    <div className="container-fluid py-5" style={{ maxWidth: 1200 }}>
      {/* Hero */}
      <div className="mb-5">
        <h1 style={{ fontSize: 48, fontWeight: 800, marginBottom: 8 }}>Passenger Dashboard</h1>
        <p className="text-muted" style={{ fontSize: 16, marginBottom: 0 }}>
          Find rides, manage bookings, and travel with confidence.
        </p>
      </div>

      {/* Cards */}
      <div className="row g-4">
        <div className="col-12">
          <div className="card shadow-sm rounded-3 border-0">
            <div className="card-body d-flex align-items-center justify-content-between" style={{ gap: 20 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h4 style={{ fontWeight: 700, marginBottom: 6 }}>Search Rides</h4>
                <p className="text-muted mb-0">
                  Quickly search available rides that match your route and preferred time. Filter by price, vehicle type, or driver rating.
                </p>
              </div>

              <div style={{ width: 300, textAlign: "right" }}>
                <Link to="/passenger/search" className="btn btn-primary btn-lg w-100" style={{ fontSize: 18 }}>
                  🔎 Search Rides
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12">
          <div className="card shadow-sm rounded-3 border-0">
            <div className="card-body d-flex align-items-center justify-content-between" style={{ gap: 20 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h4 style={{ fontWeight: 700, marginBottom: 6 }}>My Bookings</h4>
                <p className="text-muted mb-0">
                  View upcoming and past bookings. Manage cancellations and leave reviews for completed rides.
                </p>
              </div>

              <div style={{ width: 300, textAlign: "right" }}>
                <Link to="/passenger/bookings" className="btn btn-outline-primary btn-lg w-100" style={{ fontSize: 18 }}>
                  📘 View Bookings
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
