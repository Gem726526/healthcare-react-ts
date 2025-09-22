// src/components/Navbar.tsx
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { auth } from "../services/firebase";

const Navbar = () => {
    const { currentUser, role } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await auth.signOut();
        navigate("/login");
    };

    if (!currentUser) return null; // hide navbar if not logged in

    return (
        <nav className="bg-navbar text-white px-6 py-3 flex justify-between items-center">
            {/* Left Links */}
            <div className="flex space-x-6 font-medium">
                {role === "doctor" && (
                    <>
                        <Link to="/doctor" className="hover:text-primary transition">
                            Dashboard
                        </Link>
                        <Link to="/appointments" className="hover:text-primary transition">
                            Appointments
                        </Link>
                    </>
                )}
                {role === "admin" && (
                    <Link to="/admin" className="hover:text-primary transition">
                        Admin Dashboard
                    </Link>
                )}
                {role === "patient" && (
                    <Link to="/portal" className="hover:text-primary transition">
                        My Portal
                    </Link>
                )}
            </div>

            {/* Right User Info + Logout */}
            <div className="flex items-center gap-4">
                <span className="text-sm font-medium">{currentUser.displayName || currentUser.email}</span>
                <button
                    onClick={handleLogout}
                    className="bg-danger hover:bg-danger-dark px-4 py-2 rounded text-white font-semibold transition"
                >
                    Logout
                </button>
            </div>
        </nav>
    );
};

export default Navbar;
