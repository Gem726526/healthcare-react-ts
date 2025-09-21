// src/pages/AdminDashboard.tsx
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
    collection,
    getDocs,
    updateDoc,
    doc,
} from "firebase/firestore";
import { db } from "../services/firebase";
import { useLoading } from "../context/LoadingContext";

interface UserData {
    uid: string;
    email: string;
    role: string;
}

interface Patient {
    uid: string;
    email: string;
    name: string;
    doctorId: string;
}

const AdminDashboard = () => {
    const { currentUser, role } = useAuth();
    const { showLoading, hideLoading } = useLoading();

    const [users, setUsers] = useState<UserData[]>([]);
    const [patients, setPatients] = useState<Patient[]>([]);
    const [selectedDoctor, setSelectedDoctor] = useState<string>("");
    const [selectedPatient, setSelectedPatient] = useState<string>("");
    const [updatingUid, setUpdatingUid] = useState<string | null>(null);

    // ✅ Fetch users & patients
    useEffect(() => {
        const fetchData = async () => {
            try {
                showLoading();

                // Fetch users
                const usersSnap = await getDocs(collection(db, "users"));
                const usersList: UserData[] = usersSnap.docs.map((doc) => ({
                    ...(doc.data() as UserData),
                }));
                setUsers(usersList);

                // Fetch patients
                const patientsSnap = await getDocs(collection(db, "patients"));
                const patientsList: Patient[] = patientsSnap.docs.map((doc) => ({
                    ...(doc.data() as Patient),
                }));
                setPatients(patientsList);
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                hideLoading();
            }
        };

        fetchData();
    }, []);

    // ✅ Change role locally
    const handleRoleChange = (uid: string, newRole: string) => {
        setUsers((prev) =>
            prev.map((user) =>
                user.uid === uid ? { ...user, role: newRole } : user
            )
        );
    };

    // ✅ Save updated role in Firestore
    const handleSaveRole = async (uid: string) => {
        const userToUpdate = users.find((u) => u.uid === uid);
        if (!userToUpdate) return;

        setUpdatingUid(uid);
        try {
            const userRef = doc(db, "users", uid);
            await updateDoc(userRef, { role: userToUpdate.role });
        } catch (error) {
            console.error("Error updating role:", error);
        } finally {
            setUpdatingUid(null);
        }
    };

    // ✅ Assign patient to doctor
    const handleAssignPatient = async () => {
        if (!selectedDoctor || !selectedPatient) return;

        try {
            const patientRef = doc(db, "patients", selectedPatient);
            await updateDoc(patientRef, { doctorId: selectedDoctor });

            // Update local state
            setPatients((prev) =>
                prev.map((p) =>
                    p.uid === selectedPatient ? { ...p, doctorId: selectedDoctor } : p
                )
            );

            setSelectedDoctor("");
            setSelectedPatient("");
        } catch (error) {
            console.error("Error assigning patient:", error);
        }
    };

    // ✅ Helper: Get doctor email by ID
    const getDoctorEmail = (doctorId: string) => {
        const doctor = users.find((u) => u.uid === doctorId);
        return doctor ? doctor.email : "Unassigned";
    };

    return (
        <div className="p-6 bg-background min-h-screen">
            <h1 className="text-3xl font-bold mb-6 text-text">Admin Dashboard</h1>

            {/* Admin Info */}
            <div className="bg-surface p-4 rounded-lg shadow-md mb-8">
                <p>
                    Logged in as:{" "}
                    <span className="font-semibold">{currentUser?.email}</span>
                </p>
                <p className="text-sm text-gray-500">Role: {role}</p>
            </div>

            {/* Manage Users */}
            <div className="mb-10">
                <h2 className="text-xl font-semibold mb-4 text-text">All Users</h2>
                <div className="overflow-x-auto bg-surface rounded-lg shadow">
                    <table className="min-w-full border text-sm">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="p-3 border-b">Email</th>
                                <th className="p-3 border-b">Role</th>
                                <th className="p-3 border-b">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr key={user.uid} className="hover:bg-gray-50">
                                    <td className="p-3 border-b">{user.email}</td>
                                    <td className="p-3 border-b">
                                        <select
                                            className="border p-1 rounded"
                                            value={user.role}
                                            onChange={(e) =>
                                                handleRoleChange(user.uid, e.target.value)
                                            }
                                        >
                                            <option value="admin">Admin</option>
                                            <option value="doctor">Doctor</option>
                                            <option value="nurse">Nurse</option>
                                            <option value="patient">Patient</option>
                                        </select>
                                    </td>
                                    <td className="p-3 border-b">
                                        <button
                                            onClick={() => handleSaveRole(user.uid)}
                                            className="bg-primary hover:bg-primary-dark text-white px-3 py-1 rounded disabled:opacity-50"
                                            disabled={updatingUid === user.uid}
                                        >
                                            {updatingUid === user.uid ? "Saving..." : "Save"}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Assign Patients */}
            <div className="mb-10">
                <h2 className="text-xl font-semibold mb-4 text-text">
                    Assign Patients to Doctors
                </h2>
                <div className="flex gap-4 items-center">
                    {/* Patient Dropdown */}
                    <select
                        value={selectedPatient}
                        onChange={(e) => setSelectedPatient(e.target.value)}
                        className="border p-2 rounded flex-1"
                    >
                        <option value="">Select Patient</option>
                        {patients.map((p) => (
                            <option key={p.uid} value={p.uid}>
                                {p.email} ({p.name || "no name"})
                            </option>
                        ))}
                    </select>

                    {/* Doctor Dropdown */}
                    <select
                        value={selectedDoctor}
                        onChange={(e) => setSelectedDoctor(e.target.value)}
                        className="border p-2 rounded flex-1"
                    >
                        <option value="">Select Doctor</option>
                        {users
                            .filter((u) => u.role === "doctor")
                            .map((doc) => (
                                <option key={doc.uid} value={doc.uid}>
                                    {doc.email}
                                </option>
                            ))}
                    </select>

                    <button
                        onClick={handleAssignPatient}
                        className="bg-secondary hover:bg-primary-dark text-white px-4 py-2 rounded"
                    >
                        Assign
                    </button>
                </div>
            </div>

            {/* Patients Table */}
            <div>
                <h2 className="text-xl font-semibold mb-4 text-text">All Patients</h2>
                <div className="overflow-x-auto bg-surface rounded-lg shadow">
                    <table className="min-w-full border text-sm">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="p-3 border-b">Name</th>
                                <th className="p-3 border-b">Email</th>
                                <th className="p-3 border-b">Assigned Doctor</th>
                            </tr>
                        </thead>
                        <tbody>
                            {patients.map((p) => (
                                <tr key={p.uid} className="hover:bg-gray-50">
                                    <td className="p-3 border-b">{p.name || "(no name)"}</td>
                                    <td className="p-3 border-b">{p.email}</td>
                                    <td className="p-3 border-b">
                                        {getDoctorEmail(p.doctorId)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
