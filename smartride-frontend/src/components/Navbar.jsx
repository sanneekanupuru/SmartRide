import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth() || {};
  const navigate = useNavigate();

  const signout = () => {
    logout?.();
    navigate("/");
  };

  return (
    <>
      <nav className="bg-white shadow-md fixed top-0 left-0 right-0 z-50">
        <div className="container mx-auto px-6 py-3 flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold text-brandBlue">SmartRide</Link>
          <div className="flex gap-4 items-center">
            {!user?.isLoggedIn && (
              <>
                <Link to="/driver/login" className="px-4 py-2 rounded-xl border border-brandBlue text-brandBlue font-medium hover:bg-brandBlue hover:text-white transition">Driver</Link>
                <Link to="/passenger/login" className="px-4 py-2 rounded-xl border border-brandGreen text-brandGreen font-medium hover:bg-brandGreen hover:text-white transition">Passenger</Link>
              </>
            )}
            {user?.isLoggedIn && (
              <>
                {user.role === "DRIVER" ? (
                  <>
                    <Link to="/driver/dashboard" className="hover:text-brandBlue">Dashboard</Link>
                    <Link to="/driver/post" className="hover:text-brandBlue">Post Ride</Link>
                  </>
                ) : (
                  <>
                    <Link to="/passenger/dashboard" className="hover:text-brandGreen">Dashboard</Link>
                    <Link to="/passenger/search" className="hover:text-brandGreen">Search</Link>
                  </>
                )}
                <button onClick={signout} className="px-4 py-2 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition">Logout</button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Spacer so content doesn't collide with navbar */}
      <div className="h-20"></div>
    </>
  );
}
