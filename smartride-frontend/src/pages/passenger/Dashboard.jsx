import React from "react";
import { Link } from "react-router-dom";

export default function PassengerDashboard() {
  return (
    <div className="container py-5">
      <h2 className="mb-4">Passenger Dashboard</h2>
      <div className="row g-3">
        {/* Search Rides */}
        <div className="col-md-6">
          <div className="card p-4 shadow-sm h-100">
            <h5>Search Rides</h5>
            <p className="text-muted">Find a ride that matches your route</p>
            <Link className="btn btn-primary w-100" to="/passenger/search">
              Search
            </Link>
          </div>
        </div>

        {/* My Bookings */}
        <div className="col-md-6">
          <div className="card p-4 shadow-sm h-100">
            <h5>My Bookings</h5>
            <p className="text-muted">View and manage your ride bookings</p>
            <Link className="btn btn-primary w-100" to="/passenger/bookings">
              View
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
