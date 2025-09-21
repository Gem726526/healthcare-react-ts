import React, { createContext, useContext, useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../services/firebase";
import { doc, getDoc } from "firebase/firestore";
import Spinner from "../components/Spinner";

interface AuthContextType {
    currentUser: User | null;
    role: string | null;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
    currentUser: null,
    role: null,
    loading: true,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [role, setRole] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setCurrentUser(user);

                try {
                    const userDoc = await getDoc(doc(db, "users", user.uid));
                    const userData = userDoc.data();

                    if (userDoc.exists() && userData?.role) {
                        setRole(userData.role);
                    } else {
                        setRole(null);
                    }
                } catch (err) {
                    console.error("Error fetching user role:", err);
                    setRole(null);
                }
            } else {
                setCurrentUser(null);
                setRole(null);
            }

            setLoading(false); // ✅ only after auth check completes
        });

        return () => unsubscribe();
    }, []);

    return (
        <AuthContext.Provider value={{ currentUser, role, loading }}>
            {loading ? <Spinner /> : children}
        </AuthContext.Provider>
    );
};
