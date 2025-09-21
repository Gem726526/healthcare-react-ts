// src/pages/PatientDetails.tsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
    doc,
    getDoc,
    collection,
    addDoc,
    getDocs,
    query,
    orderBy,
    Timestamp,
    updateDoc,
    deleteDoc,
} from "firebase/firestore";
import { db } from "../services/firebase";
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

    // Inline loaders
    const [savingNote, setSavingNote] = useState(false);
    const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
    const [editingText, setEditingText] = useState("");
    const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);

    // Fetch patient info (global spinner)
    useEffect(() => {
        const fetchPatient = async () => {
            if (!id) return;
            try {
                showLoading();
                const ref = doc(db, "patients", id);
                const snap = await getDoc(ref);
                if (snap.exists()) {
                    setPatient(snap.data() as Patient);
                } else {
                    setPatient(null);
                }
            } catch (error) {
                console.error("Error fetching patient:", error);
            } finally {
                hideLoading();
            }
        };

        fetchPatient();
    }, [id]);

    // Fetch notes
    const fetchNotes = async () => {
        if (!id) return;
        try {
            const notesRef = collection(db, "patients", id, "notes");
            const q = query(notesRef, orderBy("createdAt", "desc"));
            const snapshot = await getDocs(q);
            const notesList: Note[] = snapshot.docs.map((doc) => ({
                ...(doc.data() as Note),
            }));
            setNotes(notesList);
        } catch (error) {
            console.error("Error fetching notes:", error);
        }
    };

    useEffect(() => {
        fetchNotes();
    }, [id]);

    // Add note (inline loader)
    const handleAddNote = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newNote.trim() || !id || !currentUser) return;

        try {
            setSavingNote(true);
            const notesRef = collection(db, "patients", id, "notes");
            await addDoc(notesRef, {
                text: newNote,
                doctorId: currentUser.uid,
                createdAt: Timestamp.now(),
            });
            setNewNote("");
            await fetchNotes();
        } catch (error) {
            console.error("Error adding note:", error);
        } finally {
            setSavingNote(false);
        }
    };

    // Save edited note (inline loader)
    const handleSaveEdit = async (noteId: string) => {
        if (!id) return;
        try {
            setEditingNoteId(noteId);
            const noteRef = doc(db, "patients", id, "notes", noteId);
            await updateDoc(noteRef, { text: editingText });
            setEditingNoteId(null);
            setEditingText("");
            await fetchNotes();
        } catch (error) {
            console.error("Error updating note:", error);
        }
    };

    // Delete note (inline loader)
    const handleDeleteNote = async (noteId: string) => {
        if (!id) return;
        try {
            setDeletingNoteId(noteId);
            const noteRef = doc(db, "patients", id, "notes", noteId);
            await deleteDoc(noteRef);
            await fetchNotes();
        } catch (error) {
            console.error("Error deleting note:", error);
        } finally {
            setDeletingNoteId(null);
        }
    };

    if (!patient) return <p className="p-6">Patient not found.</p>;

    return (
        <div className="p-6 space-y-6 bg-background min-h-screen">
            <h1 className="text-2xl font-bold text-text">Patient Details</h1>

            <div className="bg-surface p-4 rounded shadow-md space-y-2">
                <p>
                    <span className="font-semibold">Name:</span>{" "}
                    {patient.name || "(no name)"}
                </p>
                <p>
                    <span className="font-semibold">Email:</span> {patient.email}
                </p>
                <p>
                    <span className="font-semibold">Assigned Doctor ID:</span>{" "}
                    {patient.doctorId || "(not assigned)"}
                </p>
                <p>
                    <span className="font-semibold">Created At:</span>{" "}
                    {patient.createdAt}
                </p>
            </div>

            {/* Notes Section */}
            <div>
                <h2 className="text-xl font-semibold mb-2 text-text">Medical Notes</h2>

                <form onSubmit={handleAddNote} className="flex gap-2 mb-4">
                    <input
                        type="text"
                        className="border p-2 flex-1 rounded focus:ring-2 focus:ring-primary"
                        placeholder="Enter new note..."
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                    />
                    <button
                        type="submit"
                        disabled={savingNote}
                        className="bg-primary hover:bg-primary-dark text-white px-4 rounded disabled:opacity-50"
                    >
                        {savingNote ? "Saving…" : "Add"}
                    </button>
                </form>

                {notes.length === 0 ? (
                    <p className="text-gray-600">No notes yet.</p>
                ) : (
                    <ul className="space-y-2">
                        {notes.map((note) => (
                            <li
                                key={note.id}
                                className="bg-background p-2 rounded shadow-sm text-sm flex justify-between items-center"
                            >
                                {editingNoteId === note.id ? (
                                    <>
                                        <input
                                            type="text"
                                            className="border p-1 flex-1 rounded mr-2 focus:ring-1 focus:ring-primary"
                                            value={editingText}
                                            onChange={(e) => setEditingText(e.target.value)}
                                        />
                                        <button
                                            onClick={() => handleSaveEdit(note.id)}
                                            className="bg-secondary text-white px-2 py-1 rounded mr-2"
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
                                            <span className="text-xs text-gray-600">
                                                by {note.doctorId} on{" "}
                                                {note.createdAt.toDate().toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => {
                                                    setEditingNoteId(note.id);
                                                    setEditingText(note.text);
                                                }}
                                                className="text-primary hover:underline text-sm"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDeleteNote(note.id)}
                                                disabled={deletingNoteId === note.id}
                                                className="text-danger hover:underline text-sm disabled:opacity-50"
                                            >
                                                {deletingNoteId === note.id
                                                    ? "Deleting…"
                                                    : "Delete"}
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
