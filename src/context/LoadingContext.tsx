import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

import Spinner from "../components/Spinner";

interface LoadingContextType {
    showLoading: () => void;
    hideLoading: () => void;
}

const LoadingContext = createContext<LoadingContextType>({
    showLoading: () => { },
    hideLoading: () => { },
});

export const useLoading = () => useContext(LoadingContext);

export const LoadingProvider = ({ children }: { children: ReactNode }) => {
    const [loading, setLoading] = useState(false);

    const showLoading = () => setLoading(true);
    const hideLoading = () => setLoading(false);

    return (
        <LoadingContext.Provider value={{ showLoading, hideLoading }}>
            {loading && <Spinner />}
            {children}
        </LoadingContext.Provider>
    );
};
