const Unauthorized = () => {
    return (
        <div className="p-6 text-center bg-background min-h-screen flex flex-col items-center justify-center">
            <h1 className="text-2xl font-bold text-danger mb-2">Unauthorized</h1>
            <p className="text-text">
                You do not have permission to view this page.
            </p>
        </div>
    );

};

export default Unauthorized;
