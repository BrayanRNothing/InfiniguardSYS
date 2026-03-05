import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import logoImg from '../../assets/LOGOUPDM.png';
import { subirPDFCotizacion, guardarReporteTrabajo, obtenerProximoNumeroRT } from '../../utils/documentStorage';

function CrearReporteTrabajo() {
    const navigate = useNavigate();

    // Estado del formulario
    const [formData, setFormData] = useState({
        fecha: new Date().toISOString().split('T')[0],
        ordenNumero: 'RT-XXXXXX',
        cliente: '',
        direccion: '',
        contacto: '',
        vendedor: '',
        estado: 'Por Surtir',
        observaciones: ''
    });

    // Obtener el próximo número de RT al cargar
    useEffect(() => {
        obtenerProximoNumeroRT()
            .then(numero => setFormData(prev => ({ ...prev, ordenNumero: numero })))
            .catch(err => {
                console.error('Error obteniendo número de RT:', err);
                toast.error('Error al obtener número de RT');
            });
    }, []);

    // Items de productos/servicios
    const [items, setItems] = useState([
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

    const generarPDF = async () => {
        if (!formData.cliente.trim()) {
            toast.error('El nombre del cliente es requerido');
            return;
        }

        const loadingToast = toast.loading('Generando Reporte de Trabajo...');

        try {
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
            doc.text(formData.cliente, margin + 13, yPos);

            doc.setFont('helvetica', 'bold');
            doc.text('Estado:', margin + 100, yPos);
            doc.setFont('helvetica', 'normal');
            doc.text(formData.estado, margin + 113, yPos);
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

            // Empty rows for filling - reduced to 3 rows
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

            // Checklist in two columns - more compact
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

                // Question text - more compact
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

            // Observaciones finales - reduced to 2 lines
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

            // Save PDF
            const fileName = `${formData.ordenNumero || 'RT-SN'}_${formData.cliente.replace(/\s+/g, '_')}.pdf`;
            doc.save(fileName);

            // Subir PDF y guardar en BD
            const pdfBlob = doc.output('blob');
            const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });
            
            console.log('📤 Subiendo RT:', { fileName, size: pdfFile.size });
            const uploadRes = await subirPDFCotizacion(pdfFile);
            
            if (!uploadRes.url) {
                throw new Error('No se recibió URL del PDF');
            }
            
            console.log('✅ RT subido en:', uploadRes.url);

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
                creadoPor: 'Admin'
            };

            console.log('💾 Guardando RT en BD:', { numero: formData.ordenNumero });
            await guardarReporteTrabajo(datosDocumento, false);

            toast.success('Reporte de Trabajo guardado exitosamente', { id: loadingToast });
            setTimeout(() => navigate('/admin/documentos'), 1500);
        } catch (error) {
            console.error('Error al procesar RT:', error);
            toast.error('Error al guardar el Reporte de Trabajo', { id: loadingToast });
        }
    };

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header con Volver */}
            <div className="sticky top-0 z-40 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 px-2 py-3 mb-6 -mx-2 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/admin/documentos')}
                        className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100 transition-colors group"
                    >
                        <span className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center group-hover:bg-gray-200 dark:group-hover:bg-gray-600 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
                        </span>
                        Documentos
                    </button>
                    <span className="text-gray-300 dark:text-gray-600">/</span>
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Reporte de Trabajo</span>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 space-y-8">
                {/* Información General */}
                <section>
                    <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b-2 border-blue-500">
                        📋 Información General
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Fecha</label>
                            <input
                                type="date"
                                name="fecha"
                                value={formData.fecha}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Orden de Compra</label>
                            <input
                                type="text"
                                name="ordenNumero"
                                value={formData.ordenNumero}
                                onChange={handleInputChange}
                                placeholder="Número de orden"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Cliente *</label>
                            <input
                                type="text"
                                name="cliente"
                                value={formData.cliente}
                                onChange={handleInputChange}
                                placeholder="Nombre del cliente"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Contacto</label>
                            <input
                                type="text"
                                name="contacto"
                                value={formData.contacto}
                                onChange={handleInputChange}
                                placeholder="Persona de contacto"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Vendedor</label>
                            <input
                                type="text"
                                name="vendedor"
                                value={formData.vendedor}
                                onChange={handleInputChange}
                                placeholder="Nombre del vendedor"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Estado</label>
                            <select
                                name="estado"
                                value={formData.estado}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="Por Surtir">Por Surtir</option>
                                <option value="En Proceso">En Proceso</option>
                                <option value="Completado">Completado</option>
                            </select>
                        </div>
                        <div className="md:col-span-2 lg:col-span-3">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Dirección de Entrega</label>
                            <input
                                type="text"
                                name="direccion"
                                value={formData.direccion}
                                onChange={handleInputChange}
                                placeholder="Dirección completa"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div className="md:col-span-2 lg:col-span-3">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Observaciones</label>
                            <textarea
                                name="observaciones"
                                value={formData.observaciones}
                                onChange={handleInputChange}
                                placeholder="Precio, ubicación, vigencia, etc."
                                rows="2"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                            />
                        </div>
                    </div>
                </section>

                {/* Productos/Servicios */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-gray-800 pb-2 border-b-2 border-purple-500">
                            📦 Productos / Servicios
                        </h2>
                        <button
                            onClick={agregarItem}
                            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition"
                        >
                            + Agregar Item
                        </button>
                    </div>

                    <div className="space-y-4">
                        {items.map((item) => (
                            <div key={item.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="font-bold text-gray-700">Partida #{item.partida}</span>
                                    {items.length > 1 && (
                                        <button
                                            onClick={() => eliminarItem(item.id)}
                                            className="text-red-600 hover:text-red-800 font-semibold text-sm"
                                        >
                                            Eliminar
                                        </button>
                                    )}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1">Cantidad</label>
                                        <input
                                            type="number"
                                            min="1"
                                            step="0.01"
                                            value={item.cantidad}
                                            onChange={(e) => actualizarItem(item.id, 'cantidad', e.target.value)}
                                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-semibold text-gray-600 mb-1">Clave</label>
                                        <input
                                            type="text"
                                            value={item.clave}
                                            onChange={(e) => actualizarItem(item.id, 'clave', e.target.value)}
                                            placeholder="Código del producto"
                                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-semibold text-gray-600 mb-1">Descripción</label>
                                        <input
                                            type="text"
                                            value={item.descripcion}
                                            onChange={(e) => actualizarItem(item.id, 'descripcion', e.target.value)}
                                            placeholder="Descripción del producto/servicio"
                                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1">Unidad</label>
                                        <input
                                            type="text"
                                            value={item.unidad}
                                            onChange={(e) => actualizarItem(item.id, 'unidad', e.target.value)}
                                            placeholder="Ej: SERV, pza"
                                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Botones de Acción */}
                <div className="flex gap-4 pt-6 border-t">
                    <button
                        onClick={generarPDF}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition shadow-lg hover:shadow-xl"
                    >
                        📄 Generar Reporte de Trabajo
                    </button>
                    <button
                        onClick={() => navigate('/admin/documentos')}
                        className="px-6 bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 rounded-lg transition"
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
}

export default CrearReporteTrabajo;
