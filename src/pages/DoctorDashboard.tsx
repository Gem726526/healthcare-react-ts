// src/pages/DoctorDashboard.tsx
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../services/firebase";
import { Link } from "react-router-dom";
import { useLoading } from "../context/LoadingContext";

interface Patient {
    uid: string;
    email: string;
    name: string;
    doctorId: string;
    createdAt: string;
}

const DoctorDashboard = () => {
    const { currentUser, role } = useAuth();
    const { showLoading, hideLoading } = useLoading();
    const [patients, setPatients] = useState<Patient[]>([]);

    useEffect(() => {
        if (!currentUser) return;

        const fetchPatients = async () => {
            try {
                showLoading();
                const q = query(
                    collection(db, "patients"),
                    where("doctorId", "==", currentUser.uid)
                );
                const snapshot = await getDocs(q);
                const list: Patient[] = snapshot.docs.map((doc) => ({
                    ...(doc.data() as Patient),
                }));
                setPatients(list);
            } catch (error) {
                console.error("Error fetching patients:", error);
            } finally {
                hideLoading();
                console.log("Fetch patients completed", currentUser);
            }
        };

        fetchPatients();
    }, [currentUser]);

    return (

        <div className="p-6 bg-background min-h-screen">
            {/* Header */}
            <h1 className="text-3xl font-bold mb-6 text-text">Doctor Dashboard</h1>

            {/* Doctor Info */}
            <div className="bg-surface p-4 rounded-lg shadow-md mb-8">
                <p className="text-lg">
                    Welcome, <span className="font-semibold">{currentUser?.displayName ? currentUser.displayName : currentUser?.email}</span>
                </p>
                <p className="text-sm text-gray-500">Role: {role}</p>
            </div>

            {/* Assigned Patients */}
            <div>
                <h2 className="text-xl font-semibold mb-4 text-text">Assigned Patients</h2>

                {patients.length === 0 ? (
                    <p className="text-gray-500">No patients assigned to you yet.</p>
                ) : (
                    <div className="overflow-x-auto bg-surface rounded-lg shadow">
                        <table className="min-w-full border border-gray-200 text-sm">
                            <thead className="bg-gray-100 text-left">
                                <tr>
                                    <th className="p-3 border-b font-semibold">Name</th>
                                    <th className="p-3 border-b font-semibold">Email</th>
                                    <th className="p-3 border-b font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {patients.map((patient) => (
                                    <tr key={patient.uid} className="hover:bg-gray-50">
                                        <td className="p-3 border-b">{patient.name || "(no name)"}</td>
                                        <td className="p-3 border-b">{patient.email}</td>
                                        <td className="p-3 border-b">
                                            <Link
                                                to={`/doctor/patients/${patient.uid}`}
                                                className="text-primary hover:underline"
                                            >
                                                View
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );


};

export default DoctorDashboard;
