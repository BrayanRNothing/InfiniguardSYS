import React from 'react';

const PDFPreviewer = ({ url, loading }) => {
    if (loading) {
        return (
            <div className="flex-1 overflow-hidden bg-slate-200/50 flex flex-col items-center justify-center p-8 animate-pulse">
                <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                <p className="text-slate-500 font-medium">Generando vista previa...</p>
            </div>
        );
    }

    if (!url) {
        return (
            <div className="flex-1 overflow-hidden bg-slate-200/50 flex flex-col items-center justify-center p-8">
                <div className="w-16 h-16 bg-white shadow-sm rounded-xl flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                </div>
                <p className="text-slate-500 font-medium">Completa los datos para ver la vista previa del PDF</p>
                <p className="text-slate-400 text-sm mt-1">La vista previa es 100% fiel al documento final</p>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-100/50 relative group">

            
            <div className="flex-1 w-full h-full overflow-hidden flex">
                <iframe 
                    src={`${url}#toolbar=0&navpanes=0&scrollbar=1&view=FitH`} 
                    className="w-full h-full bg-white"
                    title="PDF Preview"
                />
            </div>
        </div>
    );
};

export default PDFPreviewer;
