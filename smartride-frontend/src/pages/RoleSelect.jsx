import { Link } from "react-router-dom";

export default function RoleSelect() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-brandBlue to-brandGreen">
      <div className="text-center text-white px-6">
        <h1 className="text-5xl font-extrabold mb-6 drop-shadow-lg">Welcome to SmartRide</h1>
        <p className="mb-10 text-lg opacity-90">Choose your role to continue</p>
        <div className="flex flex-col md:flex-row gap-6 justify-center">
          <Link
            to="/driver/login"
            className="px-8 py-3 rounded-2xl bg-white text-brandBlue font-semibold shadow-lg hover:scale-105 transition"
          >
            Continue as Driver
          </Link>
          <Link
            to="/passenger/login"
            className="px-8 py-3 rounded-2xl bg-white text-brandGreen font-semibold shadow-lg hover:scale-105 transition"
          >
            Continue as Passenger
          </Link>
        </div>
      </div>
    </div>
  );
}
