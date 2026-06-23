import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import logoImg from '../../assets/LOGOUPDM.png';
import { subirPDFCotizacion, guardarReporteTrabajo, obtenerProximoNumeroRT } from '../../utils/documentStorage';
import PDFPreviewer from '../../components/ui/PDFPreviewer';

function CrearReporteTrabajo() {
    const navigate = useNavigate();
    const location = useLocation();
    const [pdfPreviewUrl, setPdfPreviewUrl] = useState(null);

    // Determinar si estamos en modo edición
    const editData = location.state?.reporteTrabajo;
    const isEditing = !!editData;

    // Estado del formulario
    const [formData, setFormData] = useState({
        fecha: editData?.fecha ? new Date(editData.fecha).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        ordenNumero: editData?.numero || 'RT-XXXXXX',
        cliente: editData?.cliente?.nombre || '',
        direccion: editData?.cliente?.direccion || '',
        contacto: editData?.cliente?.contacto || '',
        vendedor: editData?.vendedor || '',
        estado: editData?.estado || 'Por Surtir',
        observaciones: editData?.observaciones || ''
    });

    // Obtener el próximo número de RT al cargar
    useEffect(() => {
        if (!isEditing) {
            obtenerProximoNumeroRT()
                .then(numero => setFormData(prev => ({ ...prev, ordenNumero: numero })))
                .catch(err => {
                    console.error('Error obteniendo número de RT:', err);
                    toast.error('Error al obtener número de RT');
                });
        }
    }, [isEditing]);

    // Items de productos/servicios
    const [items, setItems] = useState(editData?.items || [
        { id: 1, partida: 1, cantidad: 1, clave: '', descripcion: '', unidad: '' }
    ]);

    // Checklist predefinido
    const checklistPreguntas = [
        '¿Área de trabajo adecuada y ventilada?',
        '¿Equipo o unidad ya instalada?',
        '¿Equipo en azotea con acceso disponible?',
        '¿Área cuenta con energía eléctrica disponible?',
        '¿Área cuenta con suministro de agua disponible?',
        '¿Área cuenta con drenaje o desagüe adecuado?',
        '¿Se llenó reporte de Inspección en Recibo?',
        '¿Se necesitaron maniobras de carga y descarga?',
        '¿Se desempacó y empacó la unidad o máquina?',
        '¿Se desensambló y ensambló el equipo?',
        '¿Se aislaron componentes eléctricos?',
        '¿Se aplicó Infiniguard Prep para limpieza?',
        '¿Se hizo lavado con agua a presión?',
        '¿Se completó el secado del equipo?',
        '¿Se aplicó Infiniguard de acuerdo a guía?',
        '¿Condiciones de temperatura adecuadas?',
        '¿Condiciones de humedad adecuadas?',
        '¿Se etiquetó correctamente el equipo?',
        '¿Se dio de alta garantía y código QR?',
        '¿Se llenó reporte de Inspección de Envío?'
    ];

    // Handlers
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const agregarItem = () => {
        const nuevoId = items.length + 1;
        setItems([...items, {
            id: nuevoId,
            partida: nuevoId,
            cantidad: 1,
            clave: '',
            descripcion: '',
            unidad: ''
        }]);
    };

    const eliminarItem = (id) => {
        if (items.length === 1) {
            toast.error('Debe haber al menos un item');
            return;
        }
        setItems(items.filter(item => item.id !== id));
    };

    const actualizarItem = (id, campo, valor) => {
        setItems(items.map(item =>
            item.id === id ? { ...item, [campo]: valor } : item
        ));
    };

    const guardarSinDescargar = async () => {
        if (!formData.cliente.trim()) {
            toast.error('El nombre del cliente es requerido');
            return;
        }

        const t = toast.loading('Guardando cambios...');
        try {
            const datosDocumento = {
                numero: formData.ordenNumero,
                fecha: formData.fecha,
                cliente: {
                    nombre: formData.cliente,
                    direccion: formData.direccion,
                    contacto: formData.contacto
                },
                vendedor: formData.vendedor,
                estado: formData.estado,
                items: items,
                observaciones: formData.observaciones,
                pdfUrl: editData?.pdfUrl || null,
                creadoPor: 'Admin',
                ...(isEditing && editData?.numero !== formData.ordenNumero && { oldNumero: editData.numero })
            };

            await guardarReporteTrabajo(datosDocumento, true);

            toast.success('Cambios guardados correctamente', { id: t });
            setTimeout(() => navigate('/admin/documentos'), 1000);
        } catch (error) {
            console.error('Error al guardar:', error);
            toast.error('Error al guardar los cambios', { id: t });
        }
    };

    const generarDocumentoPDF = () => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.width;
        const pageHeight = doc.internal.pageSize.height;
        const margin = 15;
        let yPos = margin;

        // === HEADER (COMPACT) ===
        const logoWidth = 25;
        const logoHeight = 12;

        const img = new Image();
        img.src = logoImg;

        try {
            doc.addImage(img, 'PNG', margin, yPos, logoWidth, logoHeight);
        } catch (error) {
            console.warn('Error loading logo:', error);
        }

        doc.setTextColor(60, 60, 60);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('REPORTE DE TRABAJO', pageWidth - margin, yPos + 6, { align: 'right' });

        yPos += 16;

        // Order number and date
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text(`Orden: ${formData.ordenNumero || '________'}`, margin, yPos);
        doc.text(formData.fecha, pageWidth - margin, yPos, { align: 'right' });
        yPos += 6;

        // Separator
        doc.setDrawColor(180, 180, 180);
        doc.setLineWidth(0.3);
        doc.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 5;

        // === CLIENT INFO (COMPACT) ===
        doc.setFontSize(6);
        doc.setFont('helvetica', 'bold');
        doc.text('Cliente:', margin, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(formData.cliente || ' ', margin + 13, yPos);

        doc.setFont('helvetica', 'bold');
        doc.text('Estado:', margin + 100, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(formData.estado || ' ', margin + 113, yPos);
        yPos += 3.5;

        doc.setFont('helvetica', 'bold');
        doc.text('Contacto:', margin, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(formData.contacto || 'N/A', margin + 13, yPos);
        yPos += 3.5;

        doc.setFont('helvetica', 'bold');
        doc.text('Vendedor:', margin, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(formData.vendedor || 'N/A', margin + 15, yPos);
        yPos += 3.5;

        doc.setFont('helvetica', 'bold');
        doc.text('Dirección:', margin, yPos);
        yPos += 2.5;
        doc.setFont('helvetica', 'normal');
        if (formData.direccion) {
            const dirLines = doc.splitTextToSize(formData.direccion, pageWidth - 2 * margin);
            doc.text(dirLines, margin, yPos);
            yPos += dirLines.length * 3;
        }

        yPos += 4;

        // === PRODUCTS TABLE (COMPACT) ===
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text('PRODUCTOS / SERVICIOS', margin, yPos);
        yPos += 4;

        // Table header
        doc.setFillColor(220, 220, 220);
        doc.rect(margin, yPos, pageWidth - 2 * margin, 5, 'F');

        doc.setFontSize(6);
        doc.text('Part.', margin + 2, yPos + 3.5);
        doc.text('Cant.', margin + 12, yPos + 3.5);
        doc.text('Clave', margin + 25, yPos + 3.5);
        doc.text('Descripción', margin + 55, yPos + 3.5);
        doc.text('Unidad', pageWidth - margin - 15, yPos + 3.5);
        yPos += 6;

        // Table rows
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6);

        items.forEach((item, index) => {
            if (yPos > pageHeight - 120) {
                doc.addPage();
                yPos = margin;
            }

            doc.text(item.partida.toString(), margin + 2, yPos);
            doc.text(item.cantidad.toString(), margin + 12, yPos);
            doc.text((item.clave || '').substring(0, 20), margin + 25, yPos);

            const descLines = doc.splitTextToSize(item.descripcion || '', 100);
            doc.text(descLines, margin + 55, yPos);

            doc.text((item.unidad || '').substring(0, 8), pageWidth - margin - 15, yPos);

            yPos += Math.max(4, descLines.length * 3);
        });

        yPos += 4;

        // === OBSERVATIONS (COMPACT) ===
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.text('Observaciones:', margin, yPos);
        yPos += 3;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6);
        if (formData.observaciones) {
            const obsLines = doc.splitTextToSize(formData.observaciones, pageWidth - 2 * margin);
            doc.text(obsLines, margin, yPos);
            yPos += obsLines.length * 3;
        } else {
            doc.text('_________________________________________________________________', margin, yPos);
            yPos += 3;
        }

        yPos += 4;

        // === FINAL REPORT TABLE (COMPACT) ===
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text('2. REPORTE FINAL (Llenado por operaciones)', margin, yPos);
        yPos += 4;

        // Table header
        doc.setFillColor(220, 220, 220);
        doc.rect(margin, yPos, pageWidth - 2 * margin, 5, 'F');

        doc.setFontSize(6);
        doc.text('Partida', margin + 2, yPos + 3.5);
        doc.text('Modelo', margin + 20, yPos + 3.5);
        doc.text('Cant.', margin + 50, yPos + 3.5);
        doc.text('Marca', margin + 65, yPos + 3.5);
        doc.text('Serie', margin + 90, yPos + 3.5);
        doc.text('Folio QR', margin + 120, yPos + 3.5);
        yPos += 6;

        // Empty rows for filling
        for (let i = 0; i < 3; i++) {
            doc.setDrawColor(200, 200, 200);
            doc.line(margin, yPos, pageWidth - margin, yPos);
            yPos += 5;
        }

        yPos += 4;

        // === CHECKLIST (COMPACT) ===
        if (yPos > pageHeight - 100) {
            doc.addPage();
            yPos = margin;
        }

        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(40, 40, 40);
        doc.text('VERIFICACIÓN DE CHECK LIST', margin, yPos);
        yPos += 4;

        // Checklist in two columns
        const col1X = margin;
        const col2X = pageWidth / 2 + 1;
        const colWidth = (pageWidth / 2) - margin - 3;

        let col1Y = yPos;
        let col2Y = yPos;

        doc.setFontSize(6);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(60, 60, 60);

        checklistPreguntas.forEach((pregunta, index) => {
            const isLeftColumn = index < 10;
            const currentX = isLeftColumn ? col1X : col2X;
            let currentY = isLeftColumn ? col1Y : col2Y;

            if (currentY > pageHeight - 25) {
                doc.addPage();
                col1Y = margin;
                col2Y = margin;
                currentY = margin;
            }

            // Checkbox and number
            doc.setDrawColor(100, 100, 100);
            doc.setLineWidth(0.2);
            doc.rect(currentX, currentY - 2, 2.5, 2.5);
            doc.text(`${index + 1}.`, currentX + 3, currentY);

            // Question text
            const preguntaLines = doc.splitTextToSize(pregunta, colWidth - 25);
            doc.text(preguntaLines, currentX + 6, currentY);
            currentY += Math.max(3, preguntaLines.length * 2.5);

            // SI/NO checkboxes inline
            doc.text('SI', currentX + 6, currentY);
            doc.rect(currentX + 10, currentY - 2, 2.5, 2.5);
            doc.text('NO', currentX + 14, currentY);
            doc.rect(currentX + 19, currentY - 2, 2.5, 2.5);
            currentY += 3.5;

            if (isLeftColumn) {
                col1Y = currentY;
            } else {
                col2Y = currentY;
            }
        });

        yPos = Math.max(col1Y, col2Y) + 4;

        // === SIGNATURES (COMPACT) ===
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.text('FIRMAS', margin, yPos);
        yPos += 5;

        const sigWidth = (pageWidth - 2 * margin - 10) / 3;

        doc.setFontSize(6);
        doc.setFont('helvetica', 'normal');

        // Cliente
        doc.text('Nombre y firma Cliente', margin, yPos);
        doc.line(margin, yPos + 8, margin + sigWidth, yPos + 8);

        // Aplicador
        doc.text('Nombre y firma Aplicador', margin + sigWidth + 5, yPos);
        doc.line(margin + sigWidth + 5, yPos + 8, margin + 2 * sigWidth + 5, yPos + 8);

        // Fecha de entrega
        doc.text('Fecha de entrega', margin + 2 * sigWidth + 10, yPos);
        doc.line(margin + 2 * sigWidth + 10, yPos + 8, pageWidth - margin, yPos + 8);

        yPos += 12;

        // === FINAL DETAILS SECTION (COMPACT) ===
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(40, 40, 40);
        doc.text('DETALLES FINALES', margin, yPos);
        yPos += 4;

        // Two columns for final details
        const detailCol1X = margin;
        const detailCol2X = pageWidth / 2 + 2;
        let detailY = yPos;

        doc.setFontSize(6);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(60, 60, 60);

        // Left column
        doc.setFont('helvetica', 'bold');
        doc.text('Fecha:', detailCol1X, detailY);
        doc.setFont('helvetica', 'normal');
        doc.line(detailCol1X + 12, detailY, detailCol1X + 80, detailY);
        detailY += 4;

        doc.setFont('helvetica', 'bold');
        doc.text('Cliente:', detailCol1X, detailY);
        doc.setFont('helvetica', 'normal');
        doc.line(detailCol1X + 12, detailY, detailCol1X + 80, detailY);
        detailY += 4;

        doc.setFont('helvetica', 'bold');
        doc.text('Aplicador:', detailCol1X, detailY);
        doc.setFont('helvetica', 'normal');
        doc.line(detailCol1X + 15, detailY, detailCol1X + 80, detailY);
        detailY += 4;

        // Right column
        detailY = yPos;
        doc.setFont('helvetica', 'bold');
        doc.text('Ayudantes:', detailCol2X, detailY);
        doc.setFont('helvetica', 'normal');
        doc.line(detailCol2X + 18, detailY, pageWidth - margin, detailY);
        detailY += 4;

        doc.setFont('helvetica', 'bold');
        doc.text('Horas trabajadas:', detailCol2X, detailY);
        doc.setFont('helvetica', 'normal');
        doc.line(detailCol2X + 26, detailY, pageWidth - margin, detailY);
        detailY += 4;

        doc.setFont('helvetica', 'bold');
        doc.text('Consumo total:', detailCol2X, detailY);
        doc.setFont('helvetica', 'normal');
        doc.line(detailCol2X + 22, detailY, pageWidth - margin, detailY);
        detailY += 4;

        yPos = Math.max(detailY, yPos + 12) + 2;

        // Observaciones finales
        doc.setFont('helvetica', 'bold');
        doc.text('Observaciones:', margin, yPos);
        yPos += 3;
        doc.setFont('helvetica', 'normal');
        for (let i = 0; i < 2; i++) {
            doc.line(margin, yPos, pageWidth - margin, yPos);
            yPos += 3.5;
        }

        // Footer
        yPos = pageHeight - 10;
        doc.setFontSize(6);
        doc.setTextColor(120, 120, 120);
        doc.text('UPDM - Blvd. Rogelio Cantú Gómez 333-9, Monterrey, N.L | Tel: 813-557-3724 & 811-418-5412', pageWidth / 2, yPos, { align: 'center' });

        return doc;
    };

    // Live preview effect
    useEffect(() => {
        const timer = setTimeout(() => {
            try {
                const doc = generarDocumentoPDF();
                const blob = doc.output('blob');
                const url = URL.createObjectURL(blob);
                setPdfPreviewUrl(url);
                return () => URL.revokeObjectURL(url);
            } catch (error) {
                console.error("Error generating preview", error);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [formData, items]);

    const generarPDF = async () => {
        if (!formData.cliente.trim()) {
            toast.error('El nombre del cliente es requerido');
            return;
        }

        const loadingToast = toast.loading('Generando Reporte de Trabajo...');

        try {
            const doc = generarDocumentoPDF();
            
            // Save PDF
            const fileName = `${formData.ordenNumero || 'RT-SN'}_${formData.cliente.replace(/\s+/g, '_')}.pdf`;
            doc.save(fileName);

            // Subir PDF y guardar en BD
            const pdfBlob = doc.output('blob');
            const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });
            
            const uploadRes = await subirPDFCotizacion(pdfFile);
            
            if (!uploadRes.url) {
                throw new Error('No se recibió URL del PDF');
            }
            
            // Guardar datos en BD
            const datosDocumento = {
                numero: formData.ordenNumero,
                fecha: formData.fecha,
                cliente: {
                    nombre: formData.cliente,
                    direccion: formData.direccion,
                    contacto: formData.contacto
                },
                vendedor: formData.vendedor,
                estado: formData.estado,
                items: items,
                observaciones: formData.observaciones,
                pdfUrl: uploadRes.url,
                creadoPor: 'Admin',
                ...(isEditing && editData?.numero !== formData.ordenNumero && { oldNumero: editData.numero })
            };

            await guardarReporteTrabajo(datosDocumento, isEditing);

            toast.success('Reporte de Trabajo guardado exitosamente', { id: loadingToast });
            setTimeout(() => navigate('/admin/documentos'), 1500);
        } catch (error) {
            console.error('Error al procesar RT:', error);
            toast.error('Error al guardar el Reporte de Trabajo', { id: loadingToast });
        }
    };

    const inputBase = 'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200';

    return (
        <div className="w-full flex flex-col bg-slate-50 font-sans" style={{ height: '100vh', overflow: 'hidden' }}>
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
                    <span className="text-sm font-semibold text-slate-700">{isEditing ? `Editando ${formData.ordenNumero}` : 'Reporte de Trabajo'}</span>
                </div>
                <div className="flex items-center gap-2">
                    {isEditing && (
                        <button onClick={() => { if(window.confirm('¿Cancelar edición?')) navigate('/admin/documentos'); }} className="text-sm text-slate-500 hover:text-slate-700 font-medium px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-all">
                            Cancelar
                        </button>
                    )}
                    {isEditing && (
                        <button onClick={guardarSinDescargar} className="flex items-center gap-1.5 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition-all shadow-sm">
                            Guardar cambios
                        </button>
                    )}
                    <button onClick={generarPDF} className="flex items-center gap-1.5 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl transition-all shadow-sm hover:shadow-md">
                        {isEditing ? 'Guardar y Generar PDF' : '📄 Generar PDF'}
                    </button>
                </div>
            </div>

            {/* Split layout */}
            <div className="flex-1 flex overflow-hidden">
                {/* LEFT: Form */}
                <div className="w-[500px] min-w-[450px] overflow-y-auto bg-white border-r border-slate-200 p-6 flex flex-col gap-6 shadow-sm">
                    {/* Fecha y RT */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">No. RT</p>
                            <input name="ordenNumero" value={formData.ordenNumero} onChange={handleInputChange} placeholder="RT-XXXXXX" className={`${inputBase} font-mono`} />
                        </div>
                        <div>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Fecha</p>
                            <input type="date" name="fecha" value={formData.fecha} onChange={handleInputChange} className={inputBase} />
                        </div>
                    </div>

                    {/* Cliente */}
                    <div className="border border-slate-200 rounded-2xl p-4 space-y-3">
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Datos del Cliente</p>
                        <input name="cliente" value={formData.cliente} onChange={handleInputChange} placeholder="Nombre del cliente *" className={inputBase} />
                        <input name="direccion" value={formData.direccion} onChange={handleInputChange} placeholder="Dirección" className={inputBase} />
                        <div className="grid grid-cols-2 gap-3">
                            <input name="contacto" value={formData.contacto} onChange={handleInputChange} placeholder="Contacto" className={inputBase} />
                            <input name="vendedor" value={formData.vendedor} onChange={handleInputChange} placeholder="Vendedor" className={inputBase} />
                        </div>
                    </div>

                    {/* Estado y Observaciones */}
                    <div className="border border-slate-200 rounded-2xl p-4 space-y-3">
                        <div>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Estado</p>
                            <select name="estado" value={formData.estado} onChange={handleInputChange} className={inputBase}>
                                <option value="Por Surtir">Por Surtir</option>
                                <option value="En Proceso">En Proceso</option>
                                <option value="Finalizado">Finalizado</option>
                                <option value="Cancelado">Cancelado</option>
                            </select>
                        </div>
                        <div>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Observaciones</p>
                            <textarea name="observaciones" value={formData.observaciones} onChange={handleInputChange} rows="2" placeholder="Observaciones generales..." className={`${inputBase} resize-none`} />
                        </div>
                    </div>

                    {/* Productos/Servicios */}
                    <div className="border border-slate-200 rounded-2xl p-4">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Productos / Servicios</p>
                            <button onClick={agregarItem} className="text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition border border-emerald-100">
                                + Agregar
                            </button>
                        </div>
                        <div className="space-y-4">
                            {items.map((item, idx) => (
                                <div key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs font-bold text-slate-600">Partida #{item.partida}</span>
                                        {items.length > 1 && (
                                            <button onClick={() => eliminarItem(item.id)} className="text-rose-600 text-xs font-semibold">Quitar</button>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-[10px] text-slate-500 font-semibold block mb-1">Cantidad</label>
                                            <input type="number" min="1" value={item.cantidad} onChange={e => actualizarItem(item.id, 'cantidad', e.target.value)} className={inputBase} />
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-slate-500 font-semibold block mb-1">Unidad</label>
                                            <input value={item.unidad} onChange={e => actualizarItem(item.id, 'unidad', e.target.value)} placeholder="Ej: pza" className={inputBase} />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 gap-3">
                                        <div>
                                            <label className="text-[10px] text-slate-500 font-semibold block mb-1">Clave</label>
                                            <input value={item.clave} onChange={e => actualizarItem(item.id, 'clave', e.target.value)} placeholder="Código" className={inputBase} />
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-slate-500 font-semibold block mb-1">Descripción</label>
                                            <input value={item.descripcion} onChange={e => actualizarItem(item.id, 'descripcion', e.target.value)} placeholder="Descripción" className={inputBase} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* RIGHT: Live preview */}
                <PDFPreviewer url={pdfPreviewUrl} loading={!pdfPreviewUrl} />
            </div>
        </div>
    );
}

export default CrearReporteTrabajo;
