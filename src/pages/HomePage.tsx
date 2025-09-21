import { useAuth } from "../context/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "../services/firebase";
import { useNavigate } from "react-router-dom";

const HomePage = () => {
    const { currentUser, role } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate("/login");
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    return (
        <div className="p-6 bg-background min-h-screen">
            <h1 className="text-3xl font-bold mb-6 text-text">
                🏥 Healthcare Management App
            </h1>

            {currentUser ? (
                <div className="space-y-4">
                    <p className="text-lg text-text">
                        Welcome, <span className="font-semibold">{currentUser.email}</span>!
                    </p>

                    <p className="text-sm text-gray-600">
                        Your role:{" "}
                        <span className="font-medium">{role || "Loading..."}</span>
                    </p>

                    <button
                        onClick={handleLogout}
                        className="mt-4 bg-danger hover:bg-danger-dark text-white py-2 px-4 rounded"
                    >
                        Logout
                    </button>
                </div>
            ) : (
                <p className="text-gray-600 text-lg">You are not logged in.</p>
            )}
        </div>
    );

};

export default HomePage;
