import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import logoImg from '../../assets/LOGOUPDM.png';
import { subirPDFCotizacion, guardarOrdenTrabajo, obtenerProximoNumeroOT } from '../../utils/documentStorage';

function CrearOrdenTrabajo() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        titulo: 'MANTENIMIENTO PREVENTIVO',
        nombre: '',
        ubicacion: '',
        telefono: '',
        correo: '',
        tecnico: '',
        ayudante: '',
        fecha: new Date().toISOString().split('T')[0],
        ot: 'OT-XXXXXX',
        notas: '',
    });

    // Obtener el próximo número de OT al cargar
    useEffect(() => {
        obtenerProximoNumeroOT()
            .then(numero => setFormData(prev => ({ ...prev, ot: numero })))
            .catch(err => {
                console.error('Error obteniendo número de OT:', err);
                toast.error('Error al obtener número de OT');
            });
    }, []);

    const [equipos, setEquipos] = useState([
        { id: 1, marca: '', modelo: '', qr: '', descripcion: '' },
    ]);

    const [cantidadEquipos, setCantidadEquipos] = useState(1);

    const handleInput = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const aplicarCantidadEquipos = () => {
        const cantidad = parseInt(cantidadEquipos) || 1;
        if (cantidad < 1 || cantidad > 100) {
            toast.error('La cantidad debe estar entre 1 y 100');
            return;
        }
        
        const equiposActuales = equipos.length;
        
        if (cantidad === equiposActuales) {
            toast.info('Ya tienes esa cantidad de equipos');
            return;
        }
        
        if (cantidad > equiposActuales) {
            // Agregar equipos faltantes
            const nuevosEquipos = [...equipos];
            for (let i = equiposActuales; i < cantidad; i++) {
                nuevosEquipos.push({
                    id: Date.now() + i,
                    marca: '', modelo: '', qr: '', descripcion: ''
                });
            }
            setEquipos(nuevosEquipos);
            toast.success(`Total de equipos: ${cantidad}`);
        } else {
            // Remover equipos sobrantes
            setEquipos(equipos.slice(0, cantidad));
            toast.success(`Total de equipos: ${cantidad}`);
        }
    };

    const eliminarEquipo = (id) => {
        if (equipos.length === 1) {
            toast.error('Debe haber al menos un equipo');
            return;
        }
        const nuevosEquipos = equipos.filter(e => e.id !== id);
        setEquipos(nuevosEquipos);
        setCantidadEquipos(nuevosEquipos.length);
    };

    const actualizarEquipo = (id, campo, valor) => {
        setEquipos(equipos.map(e => e.id === id ? { ...e, [campo]: valor } : e));
    };



    const generarPDF = async () => {
        if (!formData.nombre.trim()) {
            toast.error('El nombre del cliente es requerido');
            return;
        }
        const t = toast.loading('Generando PDF...');
        try {
            const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            const W = doc.internal.pageSize.width;
            const H = doc.internal.pageSize.height;
            const M = 10;
            const GREEN = [100, 180, 50]; // Verde brillante estilo Excel

            // === HEADER TABLE (Logo | Title) ===
            autoTable(doc, {
                startY: M,
                theme: 'plain',
                body: [
                    [
                        { content: '', styles: { minCellHeight: 25, valign: 'middle', halign: 'center' } }, 
                        { content: 'MANTENIMIENTO\nPREVENTIVO', styles: { fontSize: 24, fontStyle: 'bold', halign: 'center', valign: 'middle', textColor: 20 } }
                    ]
                ],
                // Ajustar columnas: Logo izq, Titulo der
                columnStyles: {
                    0: { cellWidth: 50 },
                    1: { cellWidth: 'auto' }
                },
                styles: {
                    lineColor: [40, 40, 40],
                    lineWidth: 0.2, // Borde exterior para que parezca parte de la tabla
                },
                didDrawCell: (data) => {
                    // Dibujar logo en celda 0,0
                    if (data.section === 'body' && data.column.index === 0 && data.row.index === 0) {
                        try {
                            const img = new Image();
                            img.src = logoImg;
                            // Centrar logo en celda de 50mm ancho
                            doc.addImage(img, 'PNG', data.cell.x + 5, data.cell.y + 2, 40, 21);
                        } catch (e) { console.warn(e); }
                    }
                },
                margin: { left: M, right: M }
            });

            // Fecha formateada
            const [year, month, day] = (formData.fecha || '').split('-');
            const fechaFmt = formData.fecha ? `${day} / ${month} / ${year}` : '—';
            
            // === DATOS CLIENTE / EQUIPO ===
            // Una sola tabla pegada abajo del header
            // Estructura:
            // HEADER: DATOS DEL CLIENTE (colspan 2)
            // Row 1: Nombre | Ubicacion
            // Row 2: Telefono | Correo
            // HEADER: DATOS DEL EQUIPO (colspan 2)
            // Row 3: Tecnico | Ayudante
            // Row 4: Fecha | OT

            // Para que quede pegada, usamos startY de la tabla anterior.
            // Para "unir" bordes, el borde superior de esta tabla se superpone con el inferior de la anterior.
            
            autoTable(doc, {
                startY: doc.lastAutoTable.finalY, // Pegado
                theme: 'grid',
                head: [],
                body: [
                    // Seccion Cliente
                    [{ content: 'DATOS DEL CLIENTE', colSpan: 2, styles: { fillColor: GREEN, textColor: 255, fontStyle: 'bold', halign: 'center', cellPadding: 1.5 } }],
                    [`NOMBRE: ${formData.nombre || ''}`, `UBICACIÓN: ${formData.ubicacion || ''}`],
                    [`TELEFONO: ${formData.telefono || ''}`, `CORREO: ${formData.correo || ''}`],
                    // Seccion Equipo
                    [{ content: 'DATOS DEL EQUIPO', colSpan: 2, styles: { fillColor: GREEN, textColor: 255, fontStyle: 'bold', halign: 'center', cellPadding: 1.5 } }],
                    [`TECNICO: ${formData.tecnico || ''}`, `AYUDANTE: ${formData.ayudante || 'N/A'}`],
                    // Fecha y OT con estilo especial si se desea
                    [`FECHA: ${fechaFmt}`, `OT: ${formData.ot || ''}`]
                ],
                styles: {
                    lineColor: [40, 40, 40],
                    lineWidth: 0.2,
                    fontSize: 9,
                    cellPadding: 2,
                    textColor: [20, 20, 20]
                },
                columnStyles: {
                    0: { cellWidth: (W - 2 * M) / 2 },
                    1: { cellWidth: (W - 2 * M) / 2 }
                },
                margin: { left: M, right: M }
            });

            // === TABLA DE ITEMS ===
            const tableBody = equipos.map((e, i) => [
                i + 1,
                e.marca || '',
                e.modelo || '',
                e.qr || '',
                e.descripcion || ''
            ]);

            autoTable(doc, {
                startY: doc.lastAutoTable.finalY + 5, // Pequeño espacio
                head: [['No.', 'Marca', 'Modelo', 'QR', 'Descripción del trabajo']],
                body: tableBody,
                theme: 'grid',
                margin: { left: M, right: M },
                tableWidth: W - 2 * M,
                styles: { 
                    fontSize: 8, 
                    cellPadding: 3, 
                    lineColor: [40, 40, 40], // Bordes negros finos
                    lineWidth: 0.2,
                    textColor: [0, 0, 0]
                },
                headStyles: {
                    fillColor: GREEN, 
                    textColor: [255, 255, 255],
                    fontStyle: 'bold',
                    halign: 'center',
                    fontSize: 9,
                    lineColor: [40, 40, 40],
                    lineWidth: 0.2
                },
                columnStyles: {
                    0: { halign: 'center', cellWidth: 12 },
                    1: { cellWidth: 28 },
                    2: { cellWidth: 42 },
                    3: { cellWidth: 28 },
                    4: { cellWidth: 'auto' },
                },
                alternateRowStyles: { fillColor: [245, 253, 240] }, // Alternado verde muy suave
            });

            let y = doc.lastAutoTable.finalY + 10;

            // === NOTAS Y OBSERVACIONES ===
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10); 
            doc.setTextColor(0, 0, 0);
            doc.text('NOTAS y OBSERVACIONES:', M, y);
            y += 5;

            // Espacio par notas
            if(formData.notas){
                doc.setFontSize(9);
                const notaLines = doc.splitTextToSize(formData.notas, W - 2 * M);
                doc.text(notaLines, M, y);
                y += notaLines.length * 5 + 10;
            } else {
                y += 20; // Espacio vacio minimo
            }

            // === FIRMAS ===
            // Posicionar al fondo
             if (y > H - 35) {
                doc.addPage();
                y = 40;
            } else {
                 // Push to bottom if plenty of space
                 if (H - y > 60) y = H - 40;
                 else y += 10;
            }

            const sigW = 50;
            const sigGap = (W - 2 * M - 3 * sigW) / 2;
            const x1 = M;
            const x2 = M + sigW + sigGap;
            const x3 = M + 2 * sigW + 2 * sigGap;

            doc.setDrawColor(0); 
            doc.setLineWidth(0.5);
            doc.line(x1, y, x1 + sigW, y);
            doc.line(x2, y, x2 + sigW, y);
            doc.line(x3, y, x3 + sigW, y);

            doc.setFontSize(9);
            doc.setTextColor(0, 0, 0);
            const firmaLink = '___________________'; // Linea visual pre-rendering (opcional)
            
            // Labels
            doc.text('Firma del técnico', x1 + sigW / 2, y + 5, { align: 'center' });
            // doc.text('___________________', x1 + sigW / 2, y - 1, { align: 'center' });

            doc.text('Firma cliente', x2 + sigW / 2, y + 5, { align: 'center' });
            
            
            doc.text('Firma supervisor', x3 + sigW / 2, y + 5, { align: 'center' });
            // doc.text('Firma', x3 + 28, y + 5); 
            // Better alignment in image: "Firma supervisor: ____________"
            // But standard signature line is better. Sticking to lines.

            const fileName = `${formData.ot || 'OT-SN'}_${(formData.nombre || 'cliente').replace(/\s+/g, '_')}.pdf`;
            doc.save(fileName);

            // Subir PDF y guardar en BD
            const pdfBlob = doc.output('blob');
            const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });
            
            console.log('📤 Subiendo OT:', { fileName, size: pdfFile.size });
            const uploadRes = await subirPDFCotizacion(pdfFile);
            
            if (!uploadRes.url) {
                throw new Error('No se recibió URL del PDF');
            }
            
            console.log('✅ OT subida en:', uploadRes.url);

            // Guardar datos en BD
            const datosDocumento = {
                numero: formData.ot,
                fecha: formData.fecha,
                cliente: {
                    nombre: formData.nombre,
                    telefono: formData.telefono,
                    correo: formData.correo,
                    ubicacion: formData.ubicacion
                },
                titulo: formData.titulo,
                tecnico: formData.tecnico,
                ayudante: formData.ayudante,
                equipos: equipos,
                notas: formData.notas,
                pdfUrl: uploadRes.url,
                creadoPor: 'Admin'
            };

            console.log('💾 Guardando OT en BD:', { numero: formData.ot });
            await guardarOrdenTrabajo(datosDocumento, false);

            toast.success('Orden de Trabajo guardada exitosamente', { id: t });
            setTimeout(() => navigate('/admin/documentos'), 1500);
        } catch (err) {
            console.error('Error al procesar OT:', err);
            toast.error('Error al guardar la Orden de Trabajo', { id: t });
        }
    };

    const inputBase = 'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200';

    return (
        <div className="w-full flex flex-col" style={{ height: '100vh', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ flexShrink: 0 }} className="bg-white border-b border-slate-200 px-4 py-2.5 flex items-center justify-between shadow-sm z-40">
                <div className="flex items-center gap-2">
                    <button onClick={() => navigate('/admin/documentos')} className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors group">
                        <span className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-slate-200 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
                        </span>
                        Documentos
                    </button>
                    <span className="text-slate-300">/</span>
                    <span className="text-sm font-semibold text-slate-700">Orden de Trabajo</span>
                </div>
                <button onClick={generarPDF} className="flex items-center gap-1.5 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl transition-all shadow-sm hover:shadow-md">
                    📄 Generar PDF
                </button>
            </div>

            {/* Main Form Area */}
            <div className="flex-1 overflow-auto bg-linear-to-br from-slate-100 via-emerald-50 to-cyan-100 p-3 md:p-4">
                <div className="w-full max-w-7xl mx-auto rounded-3xl border border-slate-200 bg-white/95 backdrop-blur shadow-lg p-4 md:p-5">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

                        {/* Titulo */}
                        <div className="lg:col-span-5">
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Titulo</p>
                            <input
                                name="titulo"
                                value={formData.titulo}
                                onChange={handleInput}
                                placeholder="Ej: MANTENIMIENTO PREVENTIVO"
                                className={`${inputBase} font-bold`}
                            />
                        </div>

                        {/* OT y Fecha */}
                        <div className="lg:col-span-3">
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">No. OT</p>
                            <input name="ot" value={formData.ot} onChange={handleInput} placeholder="13001" className={`${inputBase} font-mono`} />
                        </div>
                        <div className="lg:col-span-4">
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Fecha</p>
                            <input type="date" name="fecha" value={formData.fecha} onChange={handleInput} className={inputBase} />
                        </div>

                        {/* Cliente */}
                        <div className="lg:col-span-12 border border-slate-200 rounded-2xl p-3">
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Datos del Cliente</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                                <input name="nombre" value={formData.nombre} onChange={handleInput} placeholder="Nombre *" className={inputBase} />
                                <input name="ubicacion" value={formData.ubicacion} onChange={handleInput} placeholder="Ubicacion" className={inputBase} />
                                <input name="telefono" value={formData.telefono} onChange={handleInput} placeholder="Telefono" className={inputBase} />
                                <input name="correo" value={formData.correo} onChange={handleInput} placeholder="Correo" className={inputBase} />
                            </div>
                        </div>

                        {/* Tecnico */}
                        <div className="lg:col-span-12 border border-slate-200 rounded-2xl p-3">
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Datos del Tecnico</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <input name="tecnico" value={formData.tecnico} onChange={handleInput} placeholder="Tecnico asignado" className={inputBase} />
                                <input name="ayudante" value={formData.ayudante} onChange={handleInput} placeholder="Ayudante" className={inputBase} />
                            </div>
                        </div>

                        {/* Equipos */}
                        <div className="lg:col-span-12 border border-slate-200 rounded-2xl p-3">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Equipos</p>
                                <div className="flex items-center gap-2">
                                    <input 
                                        type="number" 
                                        min="1" 
                                        max="100" 
                                        value={cantidadEquipos} 
                                        onChange={(e) => setCantidadEquipos(e.target.value)}
                                        placeholder="Cant."
                                        className="w-16 text-xs px-2 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    />
                                    <button onClick={aplicarCantidadEquipos} className="text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition border border-emerald-100">
                                        Aplicar
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                {equipos.map((eq, idx) => (
                                    <div key={eq.id} className="grid grid-cols-1 lg:grid-cols-12 gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                                        <div className="lg:col-span-12 flex items-center justify-between mb-2">
                                            <span className="text-xs font-bold text-slate-600">Equipo #{idx + 1}</span>
                                            {equipos.length > 1 && (
                                                <button onClick={() => eliminarEquipo(eq.id)} className="text-rose-600 text-xs font-semibold">Quitar</button>
                                            )}
                                        </div>
                                        <div className="lg:col-span-2">
                                            <label className="text-xs text-slate-500 font-semibold block mb-1">Marca</label>
                                            <input value={eq.marca} onChange={e => actualizarEquipo(eq.id, 'marca', e.target.value)} placeholder="Ej: Samsung, LG, etc" className={inputBase} />
                                        </div>
                                        <div className="lg:col-span-2">
                                            <label className="text-xs text-slate-500 font-semibold block mb-1">Modelo</label>
                                            <input value={eq.modelo} onChange={e => actualizarEquipo(eq.id, 'modelo', e.target.value)} placeholder="Ej: Model XYZ-123" className={inputBase} />
                                        </div>
                                        <div className="lg:col-span-3">
                                            <label className="text-xs text-slate-500 font-semibold block mb-1">Código QR / Serie</label>
                                            <input value={eq.qr} onChange={e => actualizarEquipo(eq.id, 'qr', e.target.value)} placeholder="Escanea o escribe la serie" className={inputBase} />
                                        </div>
                                        <div className="lg:col-span-5">
                                            <label className="text-xs text-slate-500 font-semibold block mb-1">Descripción del Trabajo *</label>
                                            <input value={eq.descripcion} onChange={e => actualizarEquipo(eq.id, 'descripcion', e.target.value)} placeholder="Ej: Mantenimiento, Reparación, Limpieza..." className={inputBase} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Notas */}
                        <div className="lg:col-span-12 border border-slate-200 rounded-2xl p-3">
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Notas y Observaciones</p>
                            <textarea name="notas" value={formData.notas} onChange={handleInput} rows={2} placeholder="Observaciones adicionales..." className={`${inputBase} resize-none`} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CrearOrdenTrabajo;
