import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';

function CrearOrdenTrabajo() {
    const navigate = useNavigate();

    // Estado del formulario
    const [formData, setFormData] = useState({
        // Información General
        fecha: new Date().toISOString().split('T')[0],
        cliente: '',
        claveCliente: '',
        direccion: '',
        contacto: '',
        vendedor: '',
        condiciones: '',
        estado: 'Por Surtir',

        // Información adicional
        almacen: 'GENERAL',
        sucursal: 'MAT',
        ordenCompra: '',
        agente1: '',
        viaEmbarque: ''
    });

    // Items de productos/servicios
    const [items, setItems] = useState([
        { id: 1, partida: 1, cantidad: 1, clave: '', descripcion: '', atributos: '', fechaEntrega: '', unidad: '' }
    ]);

    // Handlers
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
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
            atributos: '',
            fechaEntrega: '',
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


    const generarPDF = () => {
        // Validación básica
        if (!formData.cliente.trim()) {
            toast.error('El nombre del cliente es requerido');
            return;
        }

        const loadingToast = toast.loading('Generando PDF...');

        try {
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.width;
            const pageHeight = doc.internal.pageSize.height;
            const margin = 15;
            let yPos = margin;

            // Generate incremental order number
            let currentOrderNumber = parseInt(localStorage.getItem('lastOrderNumber') || '3871', 10);
            currentOrderNumber += 1;
            localStorage.setItem('lastOrderNumber', currentOrderNumber.toString());

            // === HEADER ===
            doc.setFontSize(20);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(40, 40, 40);
            doc.text('ORDEN DE TRABAJO', pageWidth / 2, yPos, { align: 'center' });
            yPos += 10;

            // Order number and date on same line
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(60, 60, 60);
            doc.text(`No. ${currentOrderNumber}`, margin, yPos);
            doc.text(`Fecha: ${formData.fecha}`, pageWidth - margin, yPos, { align: 'right' });
            yPos += 8;

            // Company information
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.text('UPDM - Unidad de Protección y Desarrollo de Metales', margin, yPos);
            yPos += 4;
            doc.setFont('helvetica', 'normal');
            doc.text('RFC: UPD141011MC3', margin, yPos);
            yPos += 4;
            doc.text('Blvd. Rogelio Cantú Gómez 333-9, Col. Santa María, Monterrey, N.L, 64650', margin, yPos);
            yPos += 4;
            doc.text('Tel: 813-557-3724 & 811-418-5412', margin, yPos);
            yPos += 8;

            // Línea separadora
            doc.setDrawColor(100, 100, 100);
            doc.setLineWidth(0.8);
            doc.line(margin, yPos, pageWidth - margin, yPos);
            yPos += 8;

            // === INFORMACIÓN DEL CLIENTE ===
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(40, 40, 40);
            doc.text('INFORMACIÓN DEL CLIENTE', margin, yPos);
            yPos += 6;

            // Two-column layout for client info
            const col1X = margin;
            const col2X = pageWidth / 2 + 5;

            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');

            // Left column - Client details
            let leftY = yPos;
            doc.text('Vendido a:', col1X, leftY);
            leftY += 4;
            doc.setFont('helvetica', 'normal');
            doc.text(formData.cliente, col1X, leftY);
            leftY += 4;

            if (formData.contacto) {
                doc.setFont('helvetica', 'bold');
                doc.text('Contacto:', col1X, leftY);
                doc.setFont('helvetica', 'normal');
                doc.text(formData.contacto, col1X + 18, leftY);
                leftY += 4;
            }

            if (formData.vendedor) {
                doc.setFont('helvetica', 'bold');
                doc.text('Vendedor:', col1X, leftY);
                doc.setFont('helvetica', 'normal');
                doc.text(formData.vendedor, col1X + 18, leftY);
                leftY += 4;
            }

            // Right column - Delivery info
            let rightY = yPos;
            doc.setFont('helvetica', 'bold');
            doc.text('Entregar a:', col2X, rightY);
            rightY += 4;

            if (formData.direccion) {
                doc.setFont('helvetica', 'normal');
                const direccionLines = doc.splitTextToSize(formData.direccion, (pageWidth - col2X - margin));
                doc.text(direccionLines, col2X, rightY);
                rightY += direccionLines.length * 4;
            }

            doc.setFont('helvetica', 'bold');
            doc.text('Estado:', col2X, rightY);
            doc.setFont('helvetica', 'normal');
            doc.text(formData.estado, col2X + 15, rightY);
            rightY += 4;

            yPos = Math.max(leftY, rightY) + 6;

            // === TABLA DE PRODUCTOS/SERVICIOS ===
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(40, 40, 40);
            doc.text('PRODUCTOS / SERVICIOS', margin, yPos);
            yPos += 7;

            // Headers de la tabla con fondo oscuro
            doc.setFontSize(8);
            doc.setFillColor(80, 80, 80);
            doc.rect(margin, yPos - 4, pageWidth - 2 * margin, 6, 'F');
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(255, 255, 255);
            doc.text('Part.', margin + 2, yPos);
            doc.text('Cant.', margin + 15, yPos);
            doc.text('Clave', margin + 30, yPos);
            doc.text('Descripción', margin + 60, yPos);
            doc.text('Medida', margin + 130, yPos);
            doc.text('Unidad', margin + 150, yPos);
            yPos += 6;

            // Items
            doc.setTextColor(60, 60, 60);
            doc.setFont('helvetica', 'normal');
            items.forEach((item, index) => {
                // Check if we need a new page
                if (yPos > pageHeight - 40) {
                    doc.addPage();
                    yPos = margin;
                }

                // Alternate row background
                if (index % 2 === 0) {
                    doc.setFillColor(250, 250, 250);
                    const rowHeight = Math.max(5, doc.splitTextToSize(item.descripcion || '-', 65).length * 4);
                    doc.rect(margin, yPos - 3, pageWidth - 2 * margin, rowHeight, 'F');
                }

                doc.text(item.partida.toString(), margin + 2, yPos);
                doc.text(item.cantidad.toString(), margin + 15, yPos);
                doc.text((item.clave || '-').substring(0, 15), margin + 30, yPos);

                // Descripción con wrap
                const descripcionLines = doc.splitTextToSize(item.descripcion || '-', 65);
                doc.text(descripcionLines, margin + 60, yPos);

                doc.text((item.medida || '-').substring(0, 10), margin + 130, yPos);
                doc.text((item.unidad || '-').substring(0, 10), margin + 150, yPos);

                yPos += Math.max(5, descripcionLines.length * 4);
            });

            yPos += 8;

            // === OBSERVACIONES ===
            if (yPos > pageHeight - 50) {
                doc.addPage();
                yPos = margin;
            }

            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(40, 40, 40);
            doc.text('OBSERVACIONES', margin, yPos);
            yPos += 6;

            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(60, 60, 60);
            doc.text(`Precio en ${formData.moneda} ${formData.incluyeIVA ? '+ IVA' : ''}`, margin, yPos);
            yPos += 4;
            if (formData.ubicacionAplicacion) {
                doc.text(`Ubicación de aplicación: ${formData.ubicacionAplicacion}`, margin, yPos);
                yPos += 4;
            }
            doc.text(`Vigencia: ${formData.vigencia} días`, margin, yPos);
            yPos += 4;

            if (formData.observaciones) {
                yPos += 2;
                const obsLines = doc.splitTextToSize(formData.observaciones, pageWidth - 2 * margin);
                doc.text(obsLines, margin, yPos);
                yPos += obsLines.length * 4;
            }

            // === CHECKLIST ===
            // Solo agregar nueva página si no hay suficiente espacio
            if (yPos > pageHeight - 100) {
                doc.addPage();
                yPos = margin;
            } else {
                yPos += 10;
            }

            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(40, 40, 40);
            doc.text('VERIFICACIÓN DE CHECKLIST', margin, yPos);
            yPos += 8;

            doc.setFontSize(8);
            doc.setTextColor(60, 60, 60);
            doc.setFont('helvetica', 'normal');

            // Dividir checklist en dos columnas
            const checkCol1X = margin;
            const checkCol2X = pageWidth / 2 + 5;
            const colWidth = (pageWidth / 2) - margin - 10;

            let col1Y = yPos;
            let col2Y = yPos;

            checklist.forEach((item, index) => {
                const isLeftColumn = index < 10;
                const currentX = isLeftColumn ? checkCol1X : checkCol2X;
                let currentY = isLeftColumn ? col1Y : col2Y;

                // Check if we need a new page
                if (currentY > pageHeight - 30) {
                    doc.addPage();
                    col1Y = margin;
                    col2Y = margin;
                    currentY = margin;
                }

                const respuesta = item.respuesta || '';
                const checkbox = respuesta === 'Si' ? '☑' : respuesta === 'No' ? '☒' : '☐';

                doc.text(`${item.id}. ${checkbox}`, currentX, currentY);
                const preguntaLines = doc.splitTextToSize(item.pregunta, colWidth - 10);
                doc.text(preguntaLines, currentX + 8, currentY);
                currentY += Math.max(4, preguntaLines.length * 3.5);

                if (item.comentarios) {
                    doc.setFontSize(7);
                    doc.setFont('helvetica', 'italic');
                    const comentLines = doc.splitTextToSize(`Obs: ${item.comentarios}`, colWidth - 10);
                    doc.text(comentLines, currentX + 8, currentY);
                    currentY += comentLines.length * 3;
                    doc.setFontSize(8);
                    doc.setFont('helvetica', 'normal');
                }

                currentY += 2;

                if (isLeftColumn) {
                    col1Y = currentY;
                } else {
                    col2Y = currentY;
                }
            });

            yPos = Math.max(col1Y, col2Y) + 8;

            // === FIRMAS ===
            if (yPos > pageHeight - 40) {
                doc.addPage();
                yPos = margin;
            }

            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(40, 40, 40);
            doc.text('FIRMAS', margin, yPos);
            yPos += 12;

            // Tres columnas para firmas
            const firmaCol1 = margin + 15;
            const firmaCol2 = pageWidth / 2 - 15;
            const firmaCol3 = pageWidth - margin - 45;

            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(60, 60, 60);

            // Cliente
            if (formData.nombreCliente) {
                doc.setFontSize(7);
                doc.text(formData.nombreCliente, firmaCol1, yPos - 2);
                doc.setFontSize(8);
            }
            doc.setDrawColor(100, 100, 100);
            doc.line(firmaCol1 - 10, yPos, firmaCol1 + 35, yPos);
            doc.setFont('helvetica', 'bold');
            doc.text('Cliente', firmaCol1 + 5, yPos + 4);

            // Aplicador
            doc.setFont('helvetica', 'normal');
            if (formData.nombreAplicador) {
                doc.setFontSize(7);
                doc.text(formData.nombreAplicador, firmaCol2, yPos - 2);
                doc.setFontSize(8);
            }
            doc.line(firmaCol2 - 10, yPos, firmaCol2 + 35, yPos);
            doc.setFont('helvetica', 'bold');
            doc.text('Aplicador', firmaCol2 + 2, yPos + 4);

            // Fecha
            doc.setFont('helvetica', 'normal');
            if (formData.fechaEntrega) {
                doc.setFontSize(7);
                doc.text(formData.fechaEntrega, firmaCol3, yPos - 2);
                doc.setFontSize(8);
            }
            doc.line(firmaCol3 - 10, yPos, firmaCol3 + 35, yPos);
            doc.setFont('helvetica', 'bold');
            doc.text('Fecha Entrega', firmaCol3 - 2, yPos + 4);

            // Guardar PDF
            const fileName = `Orden_Trabajo_${formData.cliente.replace(/\s+/g, '_')}_${formData.fecha}.pdf`;
            doc.save(fileName);

            toast.success('PDF generado exitosamente', { id: loadingToast });
        } catch (error) {
            console.error('Error generando PDF:', error);
            toast.error('Error al generar el PDF', { id: loadingToast });
        }
    };


    return (
        <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Orden de Trabajo</h1>
                    <p className="text-gray-600">Crear nueva orden de trabajo</p>
                </div>
                <button
                    onClick={() => navigate('/admin/documentos')}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 font-semibold"
                >
                    ← Volver
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 space-y-8">
                {/* Sección 1: Información General */}
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
                    </div>
                </section>

                {/* Sección 2: Productos/Servicios */}
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
                        {items.map((item, index) => (
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
                                    <div className="md:col-span-3">
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
                                        <label className="block text-xs font-semibold text-gray-600 mb-1">Medida</label>
                                        <input
                                            type="text"
                                            value={item.medida}
                                            onChange={(e) => actualizarItem(item.id, 'medida', e.target.value)}
                                            placeholder="Ej: m², kg"
                                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1">Unidad</label>
                                        <input
                                            type="text"
                                            value={item.unidad}
                                            onChange={(e) => actualizarItem(item.id, 'unidad', e.target.value)}
                                            placeholder="Ej: pza, lote"
                                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Sección 3: Observaciones */}
                <section>
                    <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b-2 border-green-500">
                        📝 Observaciones
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Moneda</label>
                            <select
                                name="moneda"
                                value={formData.moneda}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            >
                                <option value="MXN">MXN (Pesos)</option>
                                <option value="USD">USD (Dólares)</option>
                            </select>
                        </div>
                        <div className="flex items-center">
                            <label className="flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="incluyeIVA"
                                    checked={formData.incluyeIVA}
                                    onChange={handleInputChange}
                                    className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                                />
                                <span className="ml-2 text-sm font-semibold text-gray-700">Incluye IVA</span>
                            </label>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Vigencia (días)</label>
                            <input
                                type="number"
                                name="vigencia"
                                value={formData.vigencia}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Ubicación de Aplicación</label>
                            <input
                                type="text"
                                name="ubicacionAplicacion"
                                value={formData.ubicacionAplicacion}
                                onChange={handleInputChange}
                                placeholder="Ej: La Paz BCS"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Observaciones Adicionales</label>
                        <textarea
                            name="observaciones"
                            value={formData.observaciones}
                            onChange={handleInputChange}
                            rows="4"
                            placeholder="Notas, condiciones especiales, etc."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
                        />
                    </div>
                </section>

                {/* Sección 4: Checklist de Verificación */}
                <section>
                    <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b-2 border-orange-500">
                        ✅ Checklist de Verificación
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {checklist.map((item) => (
                            <div key={item.id} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                <div className="flex items-start gap-3 mb-2">
                                    <span className="text-sm font-semibold text-gray-600 min-w-[20px]">{item.id}.</span>
                                    <p className="text-sm font-medium text-gray-700 flex-1">{item.pregunta}</p>
                                </div>
                                <div className="flex gap-2 ml-7">
                                    <button
                                        onClick={() => actualizarChecklist(item.id, 'respuesta', 'Si')}
                                        className={`px-3 py-1 text-xs font-semibold rounded transition ${item.respuesta === 'Si'
                                            ? 'bg-green-600 text-white'
                                            : 'bg-gray-200 text-gray-600 hover:bg-green-100'
                                            }`}
                                    >
                                        Sí
                                    </button>
                                    <button
                                        onClick={() => actualizarChecklist(item.id, 'respuesta', 'No')}
                                        className={`px-3 py-1 text-xs font-semibold rounded transition ${item.respuesta === 'No'
                                            ? 'bg-red-600 text-white'
                                            : 'bg-gray-200 text-gray-600 hover:bg-red-100'
                                            }`}
                                    >
                                        No
                                    </button>
                                    <input
                                        type="text"
                                        value={item.comentarios}
                                        onChange={(e) => actualizarChecklist(item.id, 'comentarios', e.target.value)}
                                        placeholder="Comentarios..."
                                        className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-orange-500"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Sección 5: Firmas */}
                <section>
                    <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b-2 border-indigo-500">
                        ✍️ Firmas y Entrega
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre del Cliente</label>
                            <input
                                type="text"
                                name="nombreCliente"
                                value={formData.nombreCliente}
                                onChange={handleInputChange}
                                placeholder="Nombre completo"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                            <p className="text-xs text-gray-500 mt-1">Firma del cliente</p>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre del Aplicador</label>
                            <input
                                type="text"
                                name="nombreAplicador"
                                value={formData.nombreAplicador}
                                onChange={handleInputChange}
                                placeholder="Nombre completo"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                            <p className="text-xs text-gray-500 mt-1">Firma del técnico aplicador</p>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Fecha de Entrega</label>
                            <input
                                type="date"
                                name="fechaEntrega"
                                value={formData.fechaEntrega}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                            <p className="text-xs text-gray-500 mt-1">Fecha de entrega del trabajo</p>
                        </div>
                    </div>
                </section>

                {/* Botones de Acción */}
                <div className="flex gap-4 pt-6 border-t">
                    <button
                        onClick={generarPDF}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition shadow-lg hover:shadow-xl"
                    >
                        📄 Generar PDF
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

export default CrearOrdenTrabajo;
