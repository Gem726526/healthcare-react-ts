// src/pages/Register.tsx
import { useState } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth, db } from "../services/firebase";
import { doc, setDoc } from "firebase/firestore";
import { useNavigate, Link } from "react-router-dom";
import { useLoading } from "../context/LoadingContext";

const Register = () => {
    const navigate = useNavigate();
    const { showLoading, hideLoading } = useLoading();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("patient");
    const [error, setError] = useState<string | null>(null);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        showLoading();

        try {
            // 1️⃣ Create user in Firebase Auth
            const cred = await createUserWithEmailAndPassword(auth, email, password);
            const user = cred.user;

            // 2️⃣ Set displayName in Firebase Auth
            await updateProfile(user, { displayName: name });

            // 3️⃣ Save user in Firestore
            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                email: user.email,
                name, // 👈 mandatory
                role,
                createdAt: new Date().toISOString(),
            });

            // 4️⃣ If registering a patient, also add them to patients collection
            if (role === "patient") {
                await setDoc(doc(db, "patients", user.uid), {
                    uid: user.uid,
                    email: user.email,
                    name,
                    doctorId: "",
                    createdAt: new Date().toISOString(),
                });
            }

            // 5️⃣ Redirect based on role
            if (role === "doctor") {
                navigate("/doctor");
            } else if (role === "nurse") {
                navigate("/nurse");
            } else if (role === "patient") {
                navigate("/portal");
            } else {
                navigate("/");
            }
        } catch (err: unknown) {
            if (err instanceof Error) setError(err.message);
            else setError("Registration failed. Please try again.");
        } finally {
            hideLoading();
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
            <div className="bg-surface w-full max-w-md rounded-lg shadow-lg p-8">
                <h2 className="text-3xl font-bold mb-6 text-center text-text">
                    Register
                </h2>

                <form onSubmit={handleRegister} className="space-y-4">
                    <input
                        type="text"
                        placeholder="Full Name"
                        className="border border-gray-300 p-3 w-full rounded focus:ring-2 focus:ring-primary"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />

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

                    <select
                        className="border border-gray-300 p-3 w-full rounded focus:ring-2 focus:ring-primary"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                    >
                        <option value="patient">Patient</option>
                        <option value="doctor">Doctor</option>
                        <option value="nurse">Nurse</option>
                        {/* ❌ no Admin option */}
                    </select>

                    {error && <p className="text-red-500 text-sm">{error}</p>}

                    <button
                        type="submit"
                        className="w-full bg-primary hover:bg-primary-dark text-white p-3 rounded font-semibold transition"
                    >
                        Register
                    </button>
                </form>

                <p className="text-sm text-center mt-6 text-gray-600">
                    Already have an account?{" "}
                    <Link to="/login" className="text-primary hover:underline">
                        Login
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
