
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { db } from "../services/firebase";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { useLoading } from "../context/LoadingContext";

interface Patient {
  uid: string;
  email: string;
  name: string;
  doctorId: string;
  createdAt: string;
}

interface Appointment {
  id: string;
  date: string;
  status: string;
}

interface Note {
  id: string;
  text: string;
  doctorId: string;
  createdAt: string;
}

interface Doctor {
  uid: string;
  email: string;
  name: string;
}

const PatientDashboard = () => {
  const { currentUser } = useAuth();
  const { showLoading, hideLoading } = useLoading();

  const [patient, setPatient] = useState<Patient | null>(null);
  const [doctorName, setDoctorName] = useState<string>("");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) return;
      try {
        showLoading();

        // 1️⃣ Fetch patient profile
        const patientRef = doc(db, "patients", currentUser.uid);
        const patientSnap = await getDoc(patientRef);
        if (patientSnap.exists()) {
          const patientData = patientSnap.data() as Patient;
          setPatient(patientData);

          // fetch doctor name if assigned
          if (patientData.doctorId) {
            const docSnap = await getDoc(doc(db, "users", patientData.doctorId));
            if (docSnap.exists()) {
              const d = docSnap.data();
              setDoctorName(d.name || d.email || "Unknown Doctor");
            }
          }
        }

        // 2️⃣ Fetch appointments
        const apptSnap = await getDocs(
          query(collection(db, "appointments"), where("patientId", "==", currentUser.uid))
        );
        const apptList: Appointment[] = apptSnap.docs.map((d) => ({
          ...(d.data() as Appointment),
        }));
        setAppointments(apptList);

        // 3️⃣ Fetch notes
        const notesSnap = await getDocs(collection(db, "patients", currentUser.uid, "notes"));
        const notesList: Note[] = notesSnap.docs.map((d) => ({
          ...(d.data() as Note),
        }));
        setNotes(notesList);

        // 4️⃣ Fetch doctors
        const doctorsSnap = await getDocs(
          query(collection(db, "users"), where("role", "==", "doctor"))
        );
        const doctorsList: Doctor[] = doctorsSnap.docs.map((d) => ({
          ...(d.data() as Doctor),
        }));
        setDoctors(doctorsList);
      } catch (err) {
        console.error("Error fetching patient portal data:", err);
      } finally {
        hideLoading();
      }
    };

    fetchData();
  }, [currentUser]);

  return (
    <div className="p-6 bg-background min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-text">My Portal</h1>

      {/* Patient Info */}
      {patient && (
        <div className="bg-surface p-4 rounded-lg shadow-md mb-8">
          <p><span className="font-semibold">Name:</span> {patient.name}</p>
          <p><span className="font-semibold">Email:</span> {patient.email}</p>
          <p><span className="font-semibold">Assigned Doctor:</span> {doctorName || "(not assigned)"}</p>
        </div>
      )}

      {/* Appointments */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 text-text">My Appointments</h2>
        {appointments.length === 0 ? (
          <p className="text-gray-500">No appointments scheduled.</p>
        ) : (
          <div className="overflow-x-auto bg-surface rounded-lg shadow">
            <table className="min-w-full border text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3 border-b">Date</th>
                  <th className="p-3 border-b">Status</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((appt) => (
                  <tr key={appt.id} className="hover:bg-gray-50">
                    <td className="p-3 border-b">{appt.date}</td>
                    <td className="p-3 border-b">{appt.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Medical Notes */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 text-text">My Medical Notes</h2>
        {notes.length === 0 ? (
          <p className="text-gray-500">No notes yet.</p>
        ) : (
          <ul className="space-y-2">
            {notes.map((note) => (
              <li key={note.id} className="bg-gray-100 p-3 rounded shadow-sm">
                <p>{note.text}</p>
                <span className="text-xs text-gray-500">
                  by {note.doctorId} on{" "}
                  {new Date(note.createdAt).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Available Doctors */}
      <div>
        <h2 className="text-xl font-semibold mb-4 text-text">Available Doctors</h2>
        {doctors.length === 0 ? (
          <p className="text-gray-500">No doctors available right now.</p>
        ) : (
          <ul className="space-y-2">
            {doctors.map((doc) => (
              <li key={doc.uid} className="bg-surface p-3 rounded shadow-md">
                <p className="font-semibold">{doc.name}</p>
                <p className="text-sm text-gray-600">{doc.email}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default PatientDashboard;
