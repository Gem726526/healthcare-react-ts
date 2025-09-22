// src/pages/PatientDetails.tsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { db } from "../services/firebase";
import {
    doc,
    getDoc,
    collection,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    Timestamp,
} from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { useLoading } from "../context/LoadingContext";

interface Patient {
    uid: string;
    email: string;
    name: string;
    doctorId: string;
    createdAt: string;
}

interface Note {
    id: string;
    text: string;
    doctorId: string;
    createdAt: Timestamp;
}

const PatientDetails = () => {
    const { id } = useParams();
    const { currentUser } = useAuth();
    const { showLoading, hideLoading } = useLoading();

    const [patient, setPatient] = useState<Patient | null>(null);
    const [notes, setNotes] = useState<Note[]>([]);
    const [newNote, setNewNote] = useState("");
    const [savingNote, setSavingNote] = useState(false);

    const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
    const [editingText, setEditingText] = useState<Record<string, string>>({});
    const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);

    // Fetch patient + notes
    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;
            try {
                showLoading();

                // patient
                const ref = doc(db, "patients", id);
                const snap = await getDoc(ref);
                if (snap.exists()) {
                    setPatient(snap.data() as Patient);
                }

                // notes
                const notesRef = collection(db, "patients", id, "notes");
                const snapNotes = await getDocs(notesRef);
                const notesList: Note[] = snapNotes.docs.map((d) => ({
                    id: d.id,
                    ...(d.data() as Omit<Note, "id">),
                }));
                setNotes(notesList);
            } catch (err) {
                console.error("Error fetching patient:", err);
            } finally {
                hideLoading();
            }
        };

        fetchData();
    }, [id]);

    // Add note
    const handleAddNote = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newNote || !id || !currentUser) return;

        try {
            setSavingNote(true);
            const notesRef = collection(db, "patients", id, "notes");
            const docRef = await addDoc(notesRef, {
                text: newNote,
                doctorId: currentUser.uid,
                createdAt: Timestamp.now(),
            });

            setNotes((prev) => [
                ...prev,
                { id: docRef.id, text: newNote, doctorId: currentUser.uid, createdAt: Timestamp.now() },
            ]);
            setNewNote("");
        } catch (err) {
            console.error("Error adding note:", err);
        } finally {
            setSavingNote(false);
        }
    };

    // Save edit
    const handleSaveEdit = async (noteId: string) => {
        const newText = editingText[noteId];
        if (!newText) return;

        try {
            const noteRef = doc(db, "patients", id!, "notes", noteId);
            await updateDoc(noteRef, { text: newText });
            setNotes((prev) =>
                prev.map((n) => (n.id === noteId ? { ...n, text: newText } : n))
            );
        } catch (err) {
            console.error("Error updating note:", err);
        } finally {
            setEditingNoteId(null);
        }
    };

    // Delete note
    const handleDeleteNote = async (noteId: string) => {
        if (!id) return;

        try {
            setDeletingNoteId(noteId);
            const noteRef = doc(db, "patients", id, "notes", noteId);
            await deleteDoc(noteRef);
            setNotes((prev) => prev.filter((n) => n.id !== noteId));
        } catch (err) {
            console.error("Error deleting note:", err);
        } finally {
            setDeletingNoteId(null);
        }
    };

    if (!patient) return <p className="p-6">Patient not found.</p>;

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-2xl font-bold">Patient Details</h1>

            <div className="bg-white p-4 rounded shadow-md space-y-2">
                <p><span className="font-semibold">Name:</span> {patient.name || "(no name)"}</p>
                <p><span className="font-semibold">Email:</span> {patient.email}</p>
                <p><span className="font-semibold">Assigned Doctor ID:</span> {patient.doctorId || "(not assigned)"}</p>
                <p><span className="font-semibold">Created At:</span> {patient.createdAt}</p>
            </div>

            {/* Notes Section */}
            <div>
                <h2 className="text-xl font-semibold mb-2">Medical Notes</h2>

                <form onSubmit={handleAddNote} className="flex gap-2 mb-4">
                    <input
                        type="text"
                        className="border p-2 flex-1 rounded"
                        placeholder="Enter new note..."
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                    />
                    <button
                        type="submit"
                        disabled={savingNote}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 rounded disabled:opacity-50"
                    >
                        {savingNote ? "Saving…" : "Add"}
                    </button>
                </form>

                {notes.length === 0 ? (
                    <p className="text-gray-500">No notes yet.</p>
                ) : (
                    <ul className="space-y-2">
                        {notes.map((note) => (
                            <li
                                key={note.id}
                                className="bg-gray-100 p-2 rounded shadow-sm text-sm flex justify-between items-center"
                            >
                                {editingNoteId === note.id ? (
                                    <>
                                        <input
                                            type="text"
                                            className="border p-1 flex-1 rounded mr-2"
                                            value={editingText[note.id] || ""}
                                            onChange={(e) =>
                                                setEditingText((prev) => ({
                                                    ...prev,
                                                    [note.id]: e.target.value,
                                                }))
                                            }
                                        />
                                        <button
                                            onClick={() => handleSaveEdit(note.id)}
                                            className="bg-green-600 text-white px-2 py-1 rounded mr-2"
                                        >
                                            Save
                                        </button>
                                        <button
                                            onClick={() => setEditingNoteId(null)}
                                            className="bg-gray-400 text-white px-2 py-1 rounded"
                                        >
                                            Cancel
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <div>
                                            <p>{note.text}</p>
                                            <span className="text-xs text-gray-500">
                                                by {note.doctorId} on {note.createdAt.toDate().toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => {
                                                    setEditingNoteId(note.id);
                                                    setEditingText((prev) => ({
                                                        ...prev,
                                                        [note.id]: note.text,
                                                    }));
                                                }}
                                                className="text-blue-600 hover:underline text-sm"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDeleteNote(note.id)}
                                                disabled={deletingNoteId === note.id}
                                                className="text-red-600 hover:underline text-sm disabled:opacity-50"
                                            >
                                                {deletingNoteId === note.id ? "Deleting…" : "Delete"}
                                            </button>
                                        </div>
                                    </>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default PatientDetails;
