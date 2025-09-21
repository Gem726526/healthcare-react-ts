// src/pages/Appointments.tsx
import { useEffect, useState } from "react";
import {
    collection,
    getDocs,
    query,
    where,
    orderBy,
    addDoc,
    Timestamp,
} from "firebase/firestore";
import { db } from "../services/firebase";
import { useAuth } from "../context/AuthContext";
import { useLoading } from "../context/LoadingContext";

interface Appointment {
    id: string;
    patientId: string;
    doctorId: string;
    date: string;
    status: string;
    createdAt: Timestamp;
}

const Appointments = () => {
    const { currentUser } = useAuth();
    const { showLoading, hideLoading } = useLoading();

    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [patientId, setPatientId] = useState("");
    const [date, setDate] = useState("");

    const fetchAppointments = async () => {
        if (!currentUser) return;

        try {
            showLoading();
            const q = query(
                collection(db, "appointments"),
                where("doctorId", "==", currentUser.uid),
                orderBy("date", "asc")
            );
            const snapshot = await getDocs(q);
            const list: Appointment[] = snapshot.docs.map((doc) => ({
                ...(doc.data() as Appointment),
            }));
            setAppointments(list);
        } catch (error) {
            console.error("Error fetching appointments:", error);
        } finally {
            hideLoading();
        }
    };

    useEffect(() => {
        fetchAppointments();
    }, [currentUser]);

    const handleAddAppointment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!patientId || !date || !currentUser) return;

        try {
            showLoading();
            await addDoc(collection(db, "appointments"), {
                patientId,
                doctorId: currentUser.uid,
                date,
                status: "scheduled",
                createdAt: Timestamp.now(),
            });
            await fetchAppointments();
            setPatientId("");
            setDate("");
        } catch (error) {
            console.error("Error adding appointment:", error);
        } finally {
            hideLoading();
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Appointments</h1>

            {/* Create Appointment */}
            <form onSubmit={handleAddAppointment} className="mb-6 space-y-2">
                <input
                    type="text"
                    placeholder="Patient ID"
                    className="border p-2 w-full rounded"
                    value={patientId}
                    onChange={(e) => setPatientId(e.target.value)}
                    required
                />
                <input
                    type="datetime-local"
                    className="border p-2 w-full rounded"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                />
                <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                >
                    Add Appointment
                </button>
            </form>

            {/* List Appointments */}
            {appointments.length === 0 ? (
                <p>No appointments scheduled.</p>
            ) : (
                <table className="min-w-full border text-sm">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="p-2 border">Date</th>
                            <th className="p-2 border">Patient ID</th>
                            <th className="p-2 border">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {appointments.map((appt) => (
                            <tr key={appt.id} className="hover:bg-gray-50">
                                <td className="p-2 border">{appt.date}</td>
                                <td className="p-2 border">{appt.patientId}</td>
                                <td className="p-2 border">{appt.status}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default Appointments;
