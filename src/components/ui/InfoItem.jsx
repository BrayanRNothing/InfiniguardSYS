import React from 'react';

const InfoItem = ({ label, value, icon }) => (
    <div className="flex items-start gap-3 p-3 bg-gray-50/50 rounded-xl hover:bg-gray-50 transition">
        <div className="text-2xl bg-white p-2 rounded-lg shadow-sm border border-gray-100">{icon}</div>
        <div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">{label}</div>
            <div className="font-bold text-gray-800 text-sm">{value || "No registrado"}</div>
        </div>
    </div>
);

export default InfoItem;
