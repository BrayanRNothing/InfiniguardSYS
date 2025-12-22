import React from 'react';

const BotonMenu = ({ gradient, icon, titulo, sub, count, onClick }) => (
    <button onClick={onClick} className={`bg-gradient-to-br ${gradient} p-6 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col items-center justify-center w-full h-full transform hover:scale-[1.02] text-white relative overflow-hidden group border border-white/10`}>
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
        <div className="relative z-10 flex flex-col items-center">
            <div className="text-5xl lg:text-7xl mb-4 drop-shadow-md transition-transform group-hover:scale-110">{icon}</div>
            <h2 className="text-2xl lg:text-4xl font-bold mb-2 tracking-tight">{titulo}</h2>
            <p className="text-white/80 text-sm lg:text-lg font-medium">{sub}</p>
            {count > 0 && <span className="mt-6 bg-white/20 backdrop-blur-md border border-white/30 text-white px-5 py-2 rounded-full font-bold shadow-sm text-sm lg:text-base animate-pulse">{count} Solicitudes</span>}
        </div>
    </button>
);

export default BotonMenu;
