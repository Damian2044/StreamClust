

function MenuPestanas({ tabActiva, setTabActiva, isDisabled = false }) {
    const tabs = [
        { id: "datasets", label: "Structured Data" },
        { id: "imagen", label: "Images" },
        { id: "texto", label: "Text" },
    ];

    return (
        <div className={`flex gap-3 border-b border-gray-200 mt-4 ${isDisabled ? 'opacity-50' : ''}`}>
            {tabs.map((tab) => {
                const activa = tabActiva === tab.id;

                return (
                    <button
                        key={tab.id}
                        onClick={() => setTabActiva(tab.id)}
                        disabled={isDisabled}
                        className={`
                            relative px-5 py-2 text-sm font-medium
                            transition-all duration-200
                            border-b-2 rounded-t-lg

                            ${isDisabled
                                ? 'cursor-not-allowed opacity-60'
                                : ''
                            }

                            ${activa
                                ? "border-blue-500 text-gray-900 bg-gray-200 shadow-[0_0_12px_rgba(59,130,246,0.25)]"
                                : "border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                            }
                        `}
                    >
                        {tab.label}
                    </button>
                );
            })}
        </div>
    );
}

export default MenuPestanas;
