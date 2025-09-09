import { Routes, Route, useLocation } from "react-router-dom";
import RoleSelect from "./pages/RoleSelect";

// Driver pages
import DriverLogin from "./pages/driver/Login";
import DriverRegister from "./pages/driver/Register";
import DriverDashboard from "./pages/driver/Dashboard";
import DriverMyRides from "./pages/driver/MyRides";
import DriverPostRide from "./pages/driver/PostRide";

// Passenger pages
import PassengerLogin from "./pages/passenger/Login";
import PassengerRegister from "./pages/passenger/Register";
import PassengerDashboard from "./pages/passenger/Dashboard";
import PassengerSearch from "./pages/passenger/Search";
import PassengerBookings from "./pages/passenger/Bookings";
import PassengerPayment from "./pages/passenger/Payment"; // <-- new import

// Navbar & ProtectedRoute
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  const location = useLocation();
  const hideNavbarRoutes = ["/"];

  return (
    <div className="min-h-screen flex flex-col">
      {!hideNavbarRoutes.includes(location.pathname) && <Navbar />}
      <div className="flex-1">
        <Routes>
          {/* Landing page */}
          <Route path="/" element={<RoleSelect />} />

          {/* Driver auth */}
          <Route path="/driver/login" element={<DriverLogin />} />
          <Route path="/driver/register" element={<DriverRegister />} />

          {/* Driver dashboard & rides */}
          <Route
            path="/driver/dashboard"
            element={<ProtectedRoute role="DRIVER"><DriverDashboard /></ProtectedRoute>}
          />
          <Route
            path="/driver/rides"
            element={<ProtectedRoute role="DRIVER"><DriverMyRides /></ProtectedRoute>}
          />
          <Route
            path="/driver/post"
            element={<ProtectedRoute role="DRIVER"><DriverPostRide /></ProtectedRoute>}
          />

          {/* Passenger auth */}
          <Route path="/passenger/login" element={<PassengerLogin />} />
          <Route path="/passenger/register" element={<PassengerRegister />} />

          {/* Passenger pages */}
          <Route
            path="/passenger/dashboard"
            element={<ProtectedRoute role="PASSENGER"><PassengerDashboard /></ProtectedRoute>}
          />
          <Route
            path="/passenger/search"
            element={<ProtectedRoute role="PASSENGER"><PassengerSearch /></ProtectedRoute>}
          />
          <Route
            path="/passenger/bookings"
            element={<ProtectedRoute role="PASSENGER"><PassengerBookings /></ProtectedRoute>}
          />
          <Route
            path="/passenger/payment/:bookingId"
            element={<ProtectedRoute role="PASSENGER"><PassengerPayment /></ProtectedRoute>}
          /> {/* new route for Payment */}
        </Routes>
      </div>
    </div>
  );
}
