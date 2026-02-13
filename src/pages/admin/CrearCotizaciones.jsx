import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast from 'react-hot-toast';
import logoImg from '../../assets/LOGOUPDM.png';
import { guardarCotizacionSimple, subirPDFCotizacion, obtenerProximoNumeroCotizacion } from '../../utils/documentStorage';
import API_URL from '../../config/api';
import { useLocation, useNavigate } from 'react-router-dom';

const CrearCotizaciones = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [showPreview, setShowPreview] = useState(false);

    // Determinar si estamos en modo edición
    const editData = location.state?.cotizacion;
    const isEditing = !!editData;

    const [previewQuotationNumber, setPreviewQuotationNumber] = useState(editData?.numero || 'COT-XXXXXX');

    // Obtener el próximo número de cotización al cargar (solo si no es edición)
    useEffect(() => {
        if (!isEditing) {
            obtenerProximoNumeroCotizacion()
                .then(numero => setPreviewQuotationNumber(numero))
                .catch(err => {
                    console.error('Error obteniendo número:', err);
                    setPreviewQuotationNumber('COT-ERROR');
                });
        }
    }, [isEditing]);

    // Form data
    const [formData, setFormData] = useState({
        // Client info
        clienteNombre: editData?.cliente?.nombre || '',
        clienteEmpresa: editData?.cliente?.empresa || '',
        clienteEmail: editData?.cliente?.email || '',
        clienteTelefono: editData?.cliente?.telefono || '',
        clienteDireccion: editData?.cliente?.direccion || '',

        // Quotation info
        titulo: editData?.titulo || '',
        descripcion: editData?.descripcion || '',
        fecha: editData?.fecha ? new Date(editData.fecha).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        validez: editData?.validez || '30', // días
        creadoPor: editData?.creadoPor || '', // Nombre de quien crea la cotización
        notas: editData?.notas || '', // Notas adicionales

        // Financial
        moneda: editData?.moneda || 'MXN', // MXN o USD
        impuesto: editData?.impuesto || '16', // IVA %
        descuento: editData?.descuento || '0', // %
        terminosCondiciones: editData?.terminosCondiciones || 'Se requiere contar con toma de agua y suministro eléctrico cercanos para poder llevar a cabo el servicio de recubrimiento. Se otorga una garantía de 2 años contra la corrosión. ¡En caso de que el serpentín sea reemplazado antes de que concluya dicho periodo, el serpentín sustituido será recubierto nuevamente sin costo adicional por nuestra parte!',
    });

    // Line items
    const [items, setItems] = useState(editData?.productos || [
        { id: 1, descripcion: '', cantidad: 1, precioUnitario: 0 }
    ]);

    // Add new line item
    const agregarItem = () => {
        const newId = items.length > 0 ? Math.max(...items.map(i => i.id)) + 1 : 1;
        setItems([...items, { id: newId, descripcion: '', cantidad: 1, precioUnitario: 0 }]);
    };

    // Remove line item
    const eliminarItem = (id) => {
        if (items.length > 1) {
            setItems(items.filter(item => item.id !== id));
        } else {
            toast.error('Debe haber al menos un item');
        }
    };

    // Update line item
    const actualizarItem = (id, field, value) => {
        setItems(items.map(item =>
            item.id === id ? { ...item, [field]: value } : item
        ));
    };

    // Calculations
    const calcularSubtotal = (item) => {
        return (parseFloat(item.cantidad) || 0) * (parseFloat(item.precioUnitario) || 0);
    };

    const calcularTotalItems = () => {
        return items.reduce((sum, item) => sum + calcularSubtotal(item), 0);
    };

    const calcularDescuento = () => {
        return calcularTotalItems() * (parseFloat(formData.descuento) || 0) / 100;
    };

    const calcularImpuesto = () => {
        return (calcularTotalItems() - calcularDescuento()) * (parseFloat(formData.impuesto) || 0) / 100;
    };

    const calcularTotal = () => {
        return calcularTotalItems() - calcularDescuento() + calcularImpuesto();
    };

    // Format currency
    const formatCurrency = (value) => {
        const currencyCode = formData.moneda || 'MXN';
        const formatted = new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: currencyCode
        }).format(value);
        // Add MXN suffix for clarity (USD already shows in format)
        return currencyCode === 'MXN' ? `${formatted} MXN` : formatted;
    };

    // Validate form
    const validarFormulario = () => {
        if (!formData.clienteNombre.trim()) {
            toast.error('El nombre del cliente es requerido');
            return false;
        }
        if (!formData.titulo.trim()) {
            toast.error('El título de la cotización es requerido');
            return false;
        }
        if (items.some(item => !item.descripcion || !item.descripcion.trim())) {
            toast.error('Todos los items deben tener descripción');
            return false;
        }
        if (items.every(item => calcularSubtotal(item) === 0)) {
            toast.error('Debe haber al menos un item con precio');
            return false;
        }
        return true;
    };

    // Generate PDF and Save
    const generarPDF = async () => {
        if (loading) return; // Prevent multiple clicks
        if (!validarFormulario()) return;

        setLoading(true);
        const loadingToast = toast.loading(isEditing ? 'Actualizando cotización...' : 'Generando y guardando cotización...');

        try {
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.width;
            let yPos = 10;

            // Generate/Use quotation number
            let quotationNumber;
            if (isEditing) {
                // Usar el número editado por el usuario (previewQuotationNumber)
                quotationNumber = previewQuotationNumber;
            } else {
                // Obtener número fresco del servidor para evitar conflictos
                quotationNumber = await obtenerProximoNumeroCotizacion();
            }

            // Logo on the left
            const logoWidth = 40;
            const logoHeight = 20;

            // Load and add logo image
            const img = new Image();
            img.src = logoImg;

            try {
                doc.addImage(img, 'PNG', 14, yPos, logoWidth, logoHeight);
            } catch (error) {
                console.warn('Error loading logo, using text fallback:', error);
                // Fallback to text if image fails
                doc.setTextColor(60, 60, 60);
                doc.setFontSize(14);
                doc.setFont('helvetica', 'bold');
                doc.text('UPDM', 14, yPos + 10);
            }

            // Quotation number on the right
            doc.setTextColor(80, 80, 80);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text('COTIZACIÓN', pageWidth - 14, yPos + 5, { align: 'right' });
            doc.setFontSize(16);
            doc.setTextColor(60, 60, 60);
            doc.text(quotationNumber, pageWidth - 14, yPos + 12, { align: 'right' });

            // Separator line
            yPos = 35;
            doc.setDrawColor(200, 200, 200);
            doc.setLineWidth(0.5);
            doc.line(14, yPos, pageWidth - 14, yPos);

            yPos = 45;

            // Title
            doc.setTextColor(60, 60, 60);
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.text('COTIZACIÓN', pageWidth / 2, yPos, { align: 'center' });

            yPos += 10;

            // Date and Validity on the same line
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(`Fecha: ${formData.fecha}`, 14, yPos);
            doc.text(`Válida por: ${formData.validez} días`, pageWidth - 14, yPos, { align: 'right' });

            yPos += 7;

            // Issuer info below date
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(60, 60, 60);
            doc.text('Emisor: UPDM', 14, yPos);
            doc.setFont('helvetica', 'normal');
            doc.text('RFC: UPD141011MC3', pageWidth - 14, yPos, { align: 'right' });

            yPos += 5;
            doc.text('Blvd. Rogelio cantú Gómez 333-9, col Santa María, Monterrey, N.L, 64650', 14, yPos);

            yPos += 5;
            doc.text('TEL: 813-557-3724 & 811-418-5412', 14, yPos);

            yPos += 7;
            doc.setFont('helvetica', 'bold');
            doc.text(`${formData.titulo}`, 14, yPos);

            yPos += 10;

            // Client Info Box - Calculate height dynamically
            const boxStartY = yPos;
            let boxContentHeight = 5; // Initial top padding

            // Calculate how many lines each field will take
            boxContentHeight += 4; // Cliente (always present)

            if (formData.clienteEmpresa) {
                boxContentHeight += 5;
            }

            if (formData.clienteEmail) {
                boxContentHeight += 5;
            }

            if (formData.clienteTelefono) {
                boxContentHeight += 5;
            }

            if (formData.clienteDireccion) {
                const direccionLines = doc.splitTextToSize(formData.clienteDireccion, pageWidth - 60);
                boxContentHeight += 5 + (direccionLines.length - 1) * 4; // First line + additional lines
            }

            boxContentHeight += 4; // Bottom padding

            // Draw the box with calculated height
            doc.setDrawColor(200, 200, 200);
            doc.setFillColor(248, 250, 252);
            doc.roundedRect(14, boxStartY, pageWidth - 28, boxContentHeight, 2, 2, 'FD');

            yPos += 6;
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.text('CLIENTE:', 18, yPos);
            doc.setFont('helvetica', 'normal');
            doc.text(formData.clienteNombre, 35, yPos);

            if (formData.clienteEmpresa) {
                yPos += 5;
                doc.text('Empresa:', 18, yPos);
                doc.text(formData.clienteEmpresa, 35, yPos);
            }

            if (formData.clienteEmail) {
                yPos += 5;
                doc.text('Email:', 18, yPos);
                doc.text(formData.clienteEmail, 35, yPos);
            }

            if (formData.clienteTelefono) {
                yPos += 5;
                doc.text('Teléfono:', 18, yPos);
                doc.text(formData.clienteTelefono, 35, yPos);
            }

            if (formData.clienteDireccion) {
                yPos += 5;
                doc.text('Dirección:', 18, yPos);
                const direccionLines = doc.splitTextToSize(formData.clienteDireccion, pageWidth - 60);
                doc.text(direccionLines, 35, yPos);
                yPos += (direccionLines.length - 1) * 4; // Add extra space for wrapped lines
            }

            yPos += 12;

            // Description
            if (formData.descripcion) {
                doc.setFontSize(9);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(60, 60, 60);
                doc.text('DESCRIPCIÓN:', 18, yPos);
                yPos += 5;
                doc.setFont('helvetica', 'normal');
                const descLines = doc.splitTextToSize(formData.descripcion, pageWidth - 35);
                doc.text(descLines, 18, yPos);
                yPos += descLines.length * 5 + 5;
            }

            // Items Table
            const tableData = items.map(item => [
                item.descripcion,
                item.cantidad.toString(),
                formatCurrency(item.precioUnitario),
                formatCurrency(calcularSubtotal(item))
            ]);

            autoTable(doc, {
                startY: yPos,
                head: [['Descripción', 'Cantidad', 'Precio Unit.', 'Subtotal']],
                body: tableData,
                theme: 'grid',
                headStyles: {
                    fillColor: [100, 100, 100],
                    textColor: 255,
                    fontStyle: 'bold',
                    fontSize: 9
                },
                bodyStyles: {
                    fontSize: 9,
                    textColor: [60, 60, 60]
                },
                columnStyles: {
                    0: { cellWidth: 'auto' },
                    1: { cellWidth: 25, halign: 'center' },
                    2: { cellWidth: 35, halign: 'right' },
                    3: { cellWidth: 35, halign: 'right' }
                },
                margin: { left: 14, right: 14 }
            });

            yPos = doc.lastAutoTable.finalY + 8;

            // Totals
            const totalsX = pageWidth - 14;
            const totalsLabelX = totalsX - 70;

            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(60, 60, 60);

            doc.text('Subtotal:', totalsLabelX, yPos);
            doc.text(formatCurrency(calcularTotalItems()), totalsX, yPos, { align: 'right' });
            yPos += 5;

            if (parseFloat(formData.descuento) > 0) {
                doc.text(`Descuento (${formData.descuento}%):`, totalsLabelX, yPos);
                doc.text(`-${formatCurrency(calcularDescuento())}`, totalsX, yPos, { align: 'right' });
                yPos += 5;
            }

            doc.text(`IVA (${formData.impuesto}%):`, totalsLabelX, yPos);
            doc.text(formatCurrency(calcularImpuesto()), totalsX, yPos, { align: 'right' });
            yPos += 6;

            // Total line
            doc.setDrawColor(100, 100, 100);
            doc.setLineWidth(0.5);
            doc.line(totalsLabelX - 5, yPos - 4, totalsX, yPos - 4);

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(11);
            doc.setTextColor(60, 60, 60);
            doc.text('TOTAL:', totalsLabelX, yPos);
            doc.text(formatCurrency(calcularTotal()), totalsX, yPos, { align: 'right' });

            yPos += 15; // Spacing after totals

            // Pre-calculate space needed for notes and terms
            const pageHeight = doc.internal.pageSize.height;
            const footerHeight = 20; // Space reserved for footer
            const maxY = pageHeight - footerHeight;
            
            let notasHeight = 0;
            let notasLines = [];
            if (formData.notas) {
                doc.setFontSize(8);
                notasLines = doc.splitTextToSize(formData.notas, pageWidth - 28);
                notasHeight = 10 + 6 + (notasLines.length * 4) + 12; // title + spacing + text + section spacing
            }

            let termsHeight = 0;
            let termLines = [];
            if (formData.terminosCondiciones) {
                doc.setFontSize(8);
                termLines = doc.splitTextToSize(formData.terminosCondiciones, pageWidth - 28);
                termsHeight = 10 + 6 + (termLines.length * 4); // title + spacing + text
            }

            const totalContentHeight = notasHeight + termsHeight;
            const spaceAvailable = maxY - yPos;

            // If both sections don't fit on current page, start on new page
            if (totalContentHeight > spaceAvailable && totalContentHeight < maxY - 20) {
                doc.addPage();
                yPos = 20;
            }

            // Notes section
            if (formData.notas) {
                // Check if notes alone need a new page (if we didn't already add one)
                if (yPos + notasHeight > maxY) {
                    doc.addPage();
                    yPos = 20;
                }

                doc.setFontSize(10);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(60, 60, 60);
                doc.text('NOTAS:', 14, yPos);
                yPos += 6;

                doc.setFontSize(8);
                doc.setFont('helvetica', 'normal');
                doc.text(notasLines, 14, yPos);
                yPos += notasLines.length * 4 + 12; // Text height + spacing between sections
            }

            // Terms and Conditions
            if (formData.terminosCondiciones) {
                // Check if terms need a new page
                if (yPos + termsHeight > maxY) {
                    doc.addPage();
                    yPos = 20;
                }

                doc.setFontSize(10);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(60, 60, 60);
                doc.text('TÉRMINOS Y CONDICIONES:', 14, yPos);
                yPos += 6;

                doc.setFontSize(8);
                doc.setFont('helvetica', 'normal');
                doc.text(termLines, 14, yPos);
            }

            // Footer - Creator info only
            const footerY = doc.internal.pageSize.height - 15;
            doc.setFontSize(8);
            doc.setTextColor(128, 128, 128);

            // Creator info (aligned left)
            if (formData.creadoPor) {
                doc.text(`Creado por: ${formData.creadoPor}`, 14, footerY);
            }

            // Save PDF locally
            const fileName = `${quotationNumber}_${formData.clienteNombre.replace(/\s+/g, '_')}.pdf`;
            doc.save(fileName);

            // 1. Subir el PDF al servidor
            const pdfBlob = doc.output('blob');
            const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });
            const uploadRes = await subirPDFCotizacion(pdfFile);

            // 2. Guardar datos en la tabla de cotizaciones
            const datosDocumento = {
                numero: quotationNumber,
                fecha: formData.fecha,
                cliente: {
                    nombre: formData.clienteNombre,
                    empresa: formData.clienteEmpresa,
                    email: formData.clienteEmail,
                    telefono: formData.clienteTelefono,
                    direccion: formData.clienteDireccion
                },
                titulo: formData.titulo,
                descripcion: formData.descripcion,
                productos: items,
                subtotal: calcularTotalItems(),
                iva: calcularImpuesto(),
                total: calcularTotal(),
                moneda: formData.moneda,
                validez: formData.validez,
                notas: formData.notas,
                terminosCondiciones: formData.terminosCondiciones,
                creadoPor: formData.creadoPor || 'Admin',
                pdfUrl: uploadRes.url,
                // Si estamos editando y el número cambió, incluir el número antiguo
                ...(isEditing && editData?.numero !== quotationNumber && { oldNumero: editData.numero })
            };

            await guardarCotizacionSimple(datosDocumento, isEditing);

            toast.success(isEditing ? 'Cotización actualizada' : 'Cotización guardada', { id: loadingToast });
            setTimeout(() => navigate('/admin/documentos'), 1500);
        } catch (error) {
            console.error('Error al procesar cotización:', error);
            toast.dismiss(loadingToast);
            toast.error('Error al guardar la cotización');
        } finally {
            setLoading(false);
        }
    };

    // Guardar solo datos sin descargar PDF (para modo edición)
    const guardarSinDescargar = async () => {
        if (loading) return;
        if (!validarFormulario()) return;

        setLoading(true);
        const loadingToast = toast.loading('Guardando cambios...');

        try {
            const quotationNumber = previewQuotationNumber;

            // Crear datos del documento
            const datosDocumento = {
                numero: quotationNumber,
                fecha: formData.fecha,
                cliente: {
                    nombre: formData.clienteNombre,
                    empresa: formData.clienteEmpresa,
                    email: formData.clienteEmail,
                    telefono: formData.clienteTelefono,
                    direccion: formData.clienteDireccion
                },
                titulo: formData.titulo,
                descripcion: formData.descripcion,
                productos: items,
                subtotal: calcularTotalItems(),
                iva: calcularImpuesto(),
                total: calcularTotal(),
                moneda: formData.moneda,
                validez: formData.validez,
                notas: formData.notas,
                terminosCondiciones: formData.terminosCondiciones,
                creadoPor: formData.creadoPor || 'Admin',
                pdfUrl: editData?.pdfUrl || null, // Mantener el PDF existente o null
                ...(isEditing && editData?.numero !== quotationNumber && { oldNumero: editData.numero })
            };

            await guardarCotizacionSimple(datosDocumento, true);

            toast.success('Cambios guardados correctamente', { id: loadingToast });
            setTimeout(() => navigate('/admin/documentos'), 1000);
        } catch (error) {
            console.error('Error al guardar:', error);
            toast.dismiss(loadingToast);
            toast.error('Error al guardar los cambios');
        } finally {
            setLoading(false);
        }
    };

    // Cancelar y volver a la lista
    const handleCancelar = () => {
        if (window.confirm('¿Cancelar edición? Los cambios no guardados se perderán.')) {
            navigate('/admin/documentos');
        }
    };

    return (
        <div className="max-w-7xl mx-auto w-full h-screen overflow-auto">
            {/* Header */}


            <div className={`grid gap-6 ${showPreview ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
                {/* Form Section */}
                <div className={`${!showPreview ? 'grid grid-cols-2 gap-4' : ''} space-y-3`}>
                    {/* Client Information */}
                    <div className="bg-white rounded-xl border-2 border-gray-200 p-4">
                        <h2 className="text-base font-bold text-gray-800 mb-2">Información del Cliente</h2>

                        <div className="space-y-2">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Nombre del Cliente *</label>
                                <input
                                    type="text"
                                    value={formData.clienteNombre}
                                    onChange={(e) => setFormData({ ...formData, clienteNombre: e.target.value })}
                                    className="w-full px-3 py-1.5 text-sm border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Nombre completo o empresa"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Empresa</label>
                                <input
                                    type="text"
                                    value={formData.clienteEmpresa}
                                    onChange={(e) => setFormData({ ...formData, clienteEmpresa: e.target.value })}
                                    className="w-full px-3 py-1.5 text-sm border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Nombre de la empresa"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Email</label>
                                    <input
                                        type="email"
                                        value={formData.clienteEmail}
                                        onChange={(e) => setFormData({ ...formData, clienteEmail: e.target.value })}
                                        className="w-full px-3 py-1.5 text-sm border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="correo@ejemplo.com"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Teléfono</label>
                                    <input
                                        type="tel"
                                        value={formData.clienteTelefono}
                                        onChange={(e) => setFormData({ ...formData, clienteTelefono: e.target.value })}
                                        className="w-full px-3 py-1.5 text-sm border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="(123) 456-7890"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Dirección</label>
                                <input
                                    type="text"
                                    value={formData.clienteDireccion}
                                    onChange={(e) => setFormData({ ...formData, clienteDireccion: e.target.value })}
                                    className="w-full px-3 py-1.5 text-sm border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Calle, número, colonia, ciudad"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Quotation Details */}
                    <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
                        <h2 className="text-lg font-bold text-gray-800 mb-4">Detalles de la Cotización</h2>

                        <div className="space-y-4">
                            {/* Número de Cotización - Editable solo en modo edición */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">
                                    Número de Cotización {isEditing && <span className="text-blue-500">(Editable)</span>}
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={previewQuotationNumber}
                                        onChange={(e) => setPreviewQuotationNumber(e.target.value)}
                                        disabled={!isEditing}
                                        className={`flex-1 px-3 py-1.5 text-sm font-mono font-bold border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                            isEditing 
                                                ? 'border-blue-300 bg-blue-50 text-blue-700' 
                                                : 'border-gray-200 bg-gray-100 text-gray-600 cursor-not-allowed'
                                        }`}
                                        placeholder="COT-XXXXXX"
                                    />
                                    {!isEditing && (
                                        <span className="text-xs text-gray-400">Auto-generado</span>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Título *</label>
                                <input
                                    type="text"
                                    value={formData.titulo}
                                    onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                                    className="w-full px-3 py-1.5 text-sm border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Ej: Instalación de Sistema de Seguridad"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Descripción</label>
                                <textarea
                                    value={formData.descripcion}
                                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                                    rows="3"
                                    className="w-full px-3 py-1.5 text-sm border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                                    placeholder="Descripción general del proyecto..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Fecha</label>
                                    <input
                                        type="date"
                                        value={formData.fecha}
                                        onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                                        className="w-full px-3 py-1.5 text-sm border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Validez (días)</label>
                                    <input
                                        type="number"
                                        value={formData.validez}
                                        onChange={(e) => setFormData({ ...formData, validez: e.target.value })}
                                        className="w-full px-3 py-1.5 text-sm border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        min="1"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Creada por</label>
                                <input
                                    type="text"
                                    value={formData.creadoPor}
                                    onChange={(e) => setFormData({ ...formData, creadoPor: e.target.value })}
                                    className="w-full px-3 py-1.5 text-sm border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Nombre de quien crea la cotización"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Line Items */}
                    <div className="bg-white rounded-xl border-2 border-gray-200 p-4 row-span-2">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-gray-800">📦 Items / Servicios</h2>
                            <button
                                onClick={agregarItem}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
                            >
                                + Agregar Item
                            </button>
                        </div>

                        <div className="space-y-3">
                            {items.map((item, index) => (
                                <div key={item.id} className="rounded-lg p-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-bold text-gray-500">ITEM #{index + 1}</span>
                                        {items.length > 1 && (
                                            <button
                                                onClick={() => eliminarItem(item.id)}
                                                className="text-red-600 hover:text-red-700 text-sm font-semibold"
                                            >
                                                ✕ Eliminar
                                            </button>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <input
                                            type="text"
                                            value={item.descripcion}
                                            onChange={(e) => actualizarItem(item.id, 'descripcion', e.target.value)}
                                            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="Descripción del producto/servicio"
                                        />

                                        <div className="grid grid-cols-3 gap-2">
                                            <div>
                                                <label className="block text-[10px] font-bold text-gray-600 mb-1">CANT.</label>
                                                <input
                                                    type="number"
                                                    value={item.cantidad}
                                                    onChange={(e) => actualizarItem(item.id, 'cantidad', e.target.value)}
                                                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                    min="1"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-[10px] font-bold text-gray-600 mb-1">PRECIO UNIT.</label>
                                                <input
                                                    type="number"
                                                    value={item.precioUnitario}
                                                    onChange={(e) => actualizarItem(item.id, 'precioUnitario', e.target.value)}
                                                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                    min="0"
                                                    step="0.01"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-[10px] font-bold text-gray-600 mb-1">SUBTOTAL</label>
                                                <div className="px-2 py-1.5 text-sm bg-gray-100 rounded-lg font-semibold text-gray-700">
                                                    {formatCurrency(calcularSubtotal(item))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Financial Settings */}
                    <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
                        <h2 className="text-lg font-bold text-gray-800 mb-4">💰 Configuración Financiera</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Moneda</label>
                                <select
                                    value={formData.moneda}
                                    onChange={(e) => setFormData({ ...formData, moneda: e.target.value })}
                                    className="w-full px-3 py-1.5 text-sm border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="MXN">Peso Mexicano (MXN)</option>
                                    <option value="USD">Dólar Estadounidense (USD)</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">IVA (%)</label>
                                    <input
                                        type="number"
                                        value={formData.impuesto}
                                        onChange={(e) => setFormData({ ...formData, impuesto: e.target.value })}
                                        className="w-full px-3 py-1.5 text-sm border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        min="0"
                                        max="100"
                                        step="0.1"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Descuento (%)</label>
                                    <input
                                        type="number"
                                        value={formData.descuento}
                                        onChange={(e) => setFormData({ ...formData, descuento: e.target.value })}
                                        className="w-full px-3 py-1.5 text-sm border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        min="0"
                                        max="100"
                                        step="0.1"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Notes and Terms Combined */}
                    <div className="bg-white rounded-xl border-2 border-gray-200 p-4">
                        <h2 className="text-base font-bold text-gray-800 mb-2">📝 Notas y Términos</h2>

                        <div className="space-y-2">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Notas</label>
                                <textarea
                                    value={formData.notas}
                                    onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                                    rows="2"
                                    className="w-full px-3 py-1.5 text-sm border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                                    placeholder="Notas adicionales sobre la cotización..."
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Términos y Condiciones</label>
                                <textarea
                                    value={formData.terminosCondiciones}
                                    onChange={(e) => setFormData({ ...formData, terminosCondiciones: e.target.value })}
                                    rows="3"
                                    className="w-full px-3 py-1.5 text-sm border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                                    placeholder="Términos y condiciones de la cotización..."
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Preview Section - Only show when showPreview is true */}
                {showPreview && (
                    <div className="lg:sticky lg:top-0 lg:h-screen lg:overflow-auto">
                        <div className="bg-white rounded-xl border-2 border-gray-400 p-6 shadow-lg">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-bold text-gray-800">Vista Previa</h2>
                                <button
                                    onClick={() => setShowPreview(!showPreview)}
                                    className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition flex items-center gap-2"
                                >
                                    Ocultar
                                </button>
                            </div>

                            {/* Preview Header */}
                            <div className="border-b-2 border-gray-200 pb-4 mb-4">
                                <div className="flex items-start justify-between">
                                    <img src={logoImg} alt="INFINIGUARD Logo" className="h-12 object-contain" />
                                    <div className="text-right">
                                        <div className="text-xs font-bold text-gray-500 uppercase">Cotización</div>
                                        <div className="text-lg font-bold text-gray-700">{previewQuotationNumber}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Preview Content */}
                            <div className="space-y-4 text-sm">
                                <div>
                                    <h4 className="font-bold text-lg text-center mb-2 text-gray-700">COTIZACIÓN</h4>
                                    <div className="flex justify-between text-xs text-gray-600">
                                        <span>Fecha: {formData.fecha}</span>
                                        <span>Válida: {formData.validez} días</span>
                                    </div>
                                </div>

                                {formData.titulo && (
                                    <div className="font-bold text-gray-800">{formData.titulo}</div>
                                )}

                                {/* Client Info */}
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                    <div className="text-xs space-y-1.5">
                                        <div className="break-words"><span className="font-bold">Cliente:</span> {formData.clienteNombre || 'Sin especificar'}</div>
                                        {formData.clienteEmpresa && <div className="break-words"><span className="font-bold">Empresa:</span> {formData.clienteEmpresa}</div>}
                                        {formData.clienteEmail && <div className="break-words"><span className="font-bold">Email:</span> {formData.clienteEmail}</div>}
                                        {formData.clienteTelefono && <div className="break-words"><span className="font-bold">Tel:</span> {formData.clienteTelefono}</div>}
                                        {formData.clienteDireccion && <div className="break-words"><span className="font-bold">Dir:</span> {formData.clienteDireccion}</div>}
                                    </div>
                                </div>

                                {formData.descripcion && (
                                    <div className="text-xs text-gray-700">
                                        <div className="font-bold mb-1">Descripción:</div>
                                        <div className="whitespace-pre-line">{formData.descripcion}</div>
                                    </div>
                                )}

                                {/* Items Table */}
                                <div className="border border-gray-300 rounded-lg overflow-hidden">
                                    <table className="w-full text-xs">
                                        <thead className="bg-gray-600 text-white">
                                            <tr>
                                                <th className="p-2 text-left">Descripción</th>
                                                <th className="p-2 text-center w-16">Cant.</th>
                                                <th className="p-2 text-right w-20">Precio</th>
                                                <th className="p-2 text-right w-24">Subtotal</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {items.map((item, index) => (
                                                <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                                    <td className="p-2 border-t">{item.descripcion || 'Sin descripción'}</td>
                                                    <td className="p-2 border-t text-center">{item.cantidad}</td>
                                                    <td className="p-2 border-t text-right">{formatCurrency(item.precioUnitario)}</td>
                                                    <td className="p-2 border-t text-right font-semibold">{formatCurrency(calcularSubtotal(item))}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Totals */}
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span>Subtotal:</span>
                                        <span className="font-semibold">{formatCurrency(calcularTotalItems())}</span>
                                    </div>

                                    {parseFloat(formData.descuento) > 0 && (
                                        <div className="flex justify-between text-red-600">
                                            <span>Descuento ({formData.descuento}%):</span>
                                            <span className="font-semibold">-{formatCurrency(calcularDescuento())}</span>
                                        </div>
                                    )}

                                    <div className="flex justify-between">
                                        <span>IVA ({formData.impuesto}%):</span>
                                        <span className="font-semibold">{formatCurrency(calcularImpuesto())}</span>
                                    </div>

                                    <div className="flex justify-between text-lg font-bold text-gray-700 pt-2 border-t-2 border-gray-600">
                                        <span>TOTAL:</span>
                                        <span>{formatCurrency(calcularTotal())}</span>
                                    </div>
                                </div>

                                {formData.notas && (
                                    <div className="text-xs text-gray-700 border-t pt-3">
                                        <div className="font-bold mb-1">Notas:</div>
                                        <div className="whitespace-pre-line">{formData.notas}</div>
                                    </div>
                                )}

                                {formData.terminosCondiciones && (
                                    <div className="text-xs text-gray-700 border-t pt-3">
                                        <div className="font-bold mb-1">Términos y Condiciones:</div>
                                        <div className="whitespace-pre-line">{formData.terminosCondiciones}</div>
                                    </div>
                                )}
                            </div>

                            {/* Buttons in Preview */}
                            <div className="mt-6 space-y-3">
                                {isEditing && (
                                    <button
                                        onClick={guardarSinDescargar}
                                        disabled={loading}
                                        className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-3 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                                    >
                                        {loading ? '⏳ Guardando...' : '💾 Guardar Cambios'}
                                    </button>
                                )}
                                <button
                                    onClick={generarPDF}
                                    disabled={loading}
                                    className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-3 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                                >
                                    {loading ? '⏳ Procesando...' : '📄 Guardar y Descargar PDF'}
                                </button>
                                {isEditing && (
                                    <button
                                        onClick={handleCancelar}
                                        className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition shadow-sm hover:shadow flex items-center justify-center gap-2"
                                    >
                                        ❌ Cancelar
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Botones flotantes cuando no se muestra la vista previa */}
                {!showPreview && (
                    <div className="fixed bottom-6 right-6 flex gap-3 z-50">
                        {isEditing && (
                            <button
                                onClick={handleCancelar}
                                className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-5 rounded-full shadow-2xl transition flex items-center gap-2"
                            >
                                ❌ Cancelar
                            </button>
                        )}
                        {isEditing && (
                            <button
                                onClick={guardarSinDescargar}
                                disabled={loading}
                                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-3 px-5 rounded-full shadow-2xl transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? '⏳' : '💾'} Guardar
                            </button>
                        )}
                        <button
                            onClick={generarPDF}
                            disabled={loading}
                            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-3 px-5 rounded-full shadow-2xl transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? '⏳' : '📄'} {isEditing ? 'Guardar + PDF' : 'Descargar PDF'}
                        </button>
                        <button
                            onClick={() => setShowPreview(true)}
                            className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-bold py-3 px-5 rounded-full shadow-2xl transition flex items-center gap-2"
                        >
                            👁️ Vista Previa
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CrearCotizaciones;
