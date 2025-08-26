import { Link } from "react-router-dom";

export default function DriverDashboard() {
  return (
    <div className="container py-5">
      <h2 className="mb-4">Driver Dashboard</h2>
      <div className="row g-3">
        <div className="col-md-4">
          <div className="card p-4 shadow-sm">
            <h5>Post a Ride</h5>
            <p className="text-muted">Create a new ride</p>
            <Link className="btn btn-dark" to="/driver/post">Post Ride</Link>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card p-4 shadow-sm">
            <h5>My Rides</h5>
            <p className="text-muted">View your posted rides</p>
            <Link className="btn btn-outline-dark" to="/driver/rides">View</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
