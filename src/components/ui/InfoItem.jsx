import React from 'react';

const InfoItem = ({ label, value, icon }) => (
    <div className="flex items-start gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.1)] transition-all duration-300 group">
        <div className="text-2xl bg-gray-50 text-gray-600 group-hover:bg-blue-50 group-hover:text-blue-500 h-12 w-12 rounded-xl flex items-center justify-center shrink-0 transition-colors">
            {icon}
        </div>
        <div className="min-w-0 flex-1 pt-0.5">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</div>
            <div className="font-semibold text-gray-900 text-sm break-words leading-tight">{value || "No registrado"}</div>
        </div>
    </div>
);

export default InfoItem;
