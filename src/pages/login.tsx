// src/pages/login.tsx
import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../services/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate, Link } from "react-router-dom";
import { useLoading } from "../context/LoadingContext";

const Login = () => {
    const navigate = useNavigate();
    const { showLoading, hideLoading } = useLoading();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        showLoading();

        try {
            const cred = await signInWithEmailAndPassword(auth, email, password);
            const user = cred.user;

            const snap = await getDoc(doc(db, "users", user.uid));
            const role = snap.data()?.role as string | undefined;

            if (role === "admin") {
                navigate("/admin");
            } else if (role === "doctor") {
                navigate("/doctor");
            } else if (role === "nurse") {
                navigate("/nurse");
            } else {
                navigate("/portal");
            }
        } catch (err: unknown) {
            if (err instanceof Error) setError(err.message);
            else setError("Login failed. Please try again.");
        } finally {
            hideLoading();
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
            <div className="bg-surface w-full max-w-md rounded-lg shadow-lg p-8">
                <h2 className="text-3xl font-bold mb-6 text-center text-text">
                    Login
                </h2>

                <form onSubmit={handleLogin} className="space-y-4">
                    <input
                        type="email"
                        placeholder="Email"
                        className="border border-gray-300 p-3 w-full rounded focus:ring-2 focus:ring-primary"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />

                    <input
                        type="password"
                        placeholder="Password"
                        className="border border-gray-300 p-3 w-full rounded focus:ring-2 focus:ring-primary"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />

                    {error && <p className="text-danger text-sm">{error}</p>}

                    <button
                        type="submit"
                        className="w-full bg-primary hover:bg-primary-dark text-white p-3 rounded font-semibold transition"
                    >
                        Login
                    </button>
                </form>

                <p className="text-sm text-center mt-6 text-gray-600">
                    Don&apos;t have an account?{" "}
                    <Link to="/register" className="text-primary hover:underline">
                        Register
                    </Link>
                </p>
            </div>
        </div>
    );

};

export default Login;