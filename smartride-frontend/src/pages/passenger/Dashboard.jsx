import { Link } from "react-router-dom";

export default function PassengerDashboard() {
  return (
    <div className="container py-5">
      <h2 className="mb-4">Passenger Dashboard</h2>
      <div className="row g-3">
        <div className="col-md-4">
          <div className="card p-4 shadow-sm">
            <h5>Search Rides</h5>
            <p className="text-muted">Find a ride</p>
            <Link className="btn btn-primary" to="/passenger/search">Search</Link>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card p-4 shadow-sm">
            <h5>My Bookings</h5>
            <p className="text-muted">View your bookings</p>
            <Link className="btn btn-outline-primary" to="/passenger/bookings">View</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
