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
    <div className="w-full flex flex-col" style={{ height: '100vh', overflow: 'hidden' }}>
        {/* Header sticky */}
        <div style={{ flexShrink: 0 }} className="bg-white border-b border-gray-100 px-4 py-2.5 flex items-center justify-between z-40 shadow-sm">
            <div className="flex items-center gap-2">
                <button onClick={() => navigate('/admin/documentos')} className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-gray-800 transition-colors group">
                    <span className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
                    </span>
                    Documentos
                </button>
                <span className="text-gray-300">/</span>
                <span className="text-sm text-gray-400">Cotizaciones</span>
                <span className="text-gray-300">/</span>
                <span className="text-sm font-semibold text-gray-700">{isEditing ? `Editando ${previewQuotationNumber}` : 'Nueva Cotizacion'}</span>
            </div>
            <div className="flex items-center gap-2">
                {isEditing && (
                    <button onClick={handleCancelar} className="text-sm text-gray-500 hover:text-gray-700 font-medium px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-all">
                        Cancelar edicion
                    </button>
                )}
                {isEditing && (
                    <button onClick={guardarSinDescargar} disabled={loading} className="flex items-center gap-1.5 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition-all disabled:opacity-50">
                        {loading ? 'Guardando...' : 'Guardar cambios'}
                    </button>
                )}
                <button onClick={generarPDF} disabled={loading} className="flex items-center gap-1.5 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg transition-all disabled:opacity-50 shadow-sm">
                    {loading ? 'Procesando...' : 'Guardar y Descargar PDF'}
                </button>
            </div>
        </div>

        {/* Split Panel */}
        <div className="flex" style={{ flex: 1, overflow: 'hidden' }}>

            {/* LEFT: Compact scrollable form */}
            <div className="border-r border-gray-100 flex flex-col" style={{ width: 370, flexShrink: 0 }}>
                <div style={{ flex: 1, overflowY: 'auto' }} className="px-3 py-3 space-y-2">

                    {/* N de cotizacion */}
                    <div className="bg-blue-50 border border-blue-100 rounded-xl px-3 py-2 flex items-center justify-between">
                        <span className="text-xs font-bold text-blue-500 uppercase tracking-wide">N{'\u00BA'} Cotizacion</span>
                        <span className="font-mono font-bold text-blue-700 text-sm">{previewQuotationNumber}</span>
                    </div>

                    {/* Cliente */}
                    <div className="bg-white border border-gray-200 rounded-xl p-3 space-y-2">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Cliente</p>
                        <input type="text" value={formData.clienteNombre} onChange={(e) => setFormData({ ...formData, clienteNombre: e.target.value })} placeholder="Nombre del cliente *" className="w-full text-sm px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-400 focus:border-blue-400 outline-none" />
                        <input type="text" value={formData.clienteEmpresa} onChange={(e) => setFormData({ ...formData, clienteEmpresa: e.target.value })} placeholder="Empresa" className="w-full text-sm px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-400 outline-none" />
                        <div className="grid grid-cols-2 gap-2">
                            <input type="email" value={formData.clienteEmail} onChange={(e) => setFormData({ ...formData, clienteEmail: e.target.value })} placeholder="Email" className="w-full text-sm px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-400 outline-none" />
                            <input type="tel" value={formData.clienteTelefono} onChange={(e) => setFormData({ ...formData, clienteTelefono: e.target.value })} placeholder="Telefono" className="w-full text-sm px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-400 outline-none" />
                        </div>
                        <input type="text" value={formData.clienteDireccion} onChange={(e) => setFormData({ ...formData, clienteDireccion: e.target.value })} placeholder="Direccion" className="w-full text-sm px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-400 outline-none" />
                    </div>

                    {/* Detalles de cotizacion */}
                    <div className="bg-white border border-gray-200 rounded-xl p-3 space-y-2">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Detalles</p>
                        <input type="text" value={formData.titulo} onChange={(e) => setFormData({ ...formData, titulo: e.target.value })} placeholder="Titulo *" className="w-full text-sm px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-400 outline-none" />
                        <textarea value={formData.descripcion} onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })} placeholder="Descripcion (opcional)" rows={2} className="w-full text-sm px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-400 outline-none resize-none" />
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="text-xs text-gray-400 font-semibold block mb-0.5">Fecha</label>
                                <input type="date" value={formData.fecha} onChange={(e) => setFormData({ ...formData, fecha: e.target.value })} className="w-full text-sm px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-400 outline-none" />
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 font-semibold block mb-0.5">Validez (dias)</label>
                                <input type="number" value={formData.validez} onChange={(e) => setFormData({ ...formData, validez: e.target.value })} className="w-full text-sm px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-400 outline-none" min="1" />
                            </div>
                        </div>
                        <input type="text" value={formData.creadoPor} onChange={(e) => setFormData({ ...formData, creadoPor: e.target.value })} placeholder="Creada por" className="w-full text-sm px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-400 outline-none" />
                    </div>

                    {/* Items */}
                    <div className="bg-white border border-gray-200 rounded-xl p-3">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Items / Servicios</p>
                            <button onClick={agregarItem} className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-lg transition-all">+ Agregar</button>
                        </div>
                        <div className="space-y-2">
                            {items.map((item, index) => (
                                <div key={item.id} className="bg-gray-50 rounded-lg p-2 border border-gray-100">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-xs font-bold text-gray-400">ITEM #{index + 1}</span>
                                        {items.length > 1 && (
                                            <button onClick={() => eliminarItem(item.id)} className="text-red-400 hover:text-red-600 text-xs font-bold">x</button>
                                        )}
                                    </div>
                                    <input type="text" value={item.descripcion} onChange={(e) => actualizarItem(item.id, 'descripcion', e.target.value)} placeholder="Descripcion" className="w-full text-xs px-2 py-1.5 bg-white border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-400 outline-none mb-1.5" />
                                    <div className="grid grid-cols-3 gap-1.5">
                                        <div>
                                            <label className="text-xs text-gray-400 font-bold block">CANT.</label>
                                            <input type="number" value={item.cantidad} onChange={(e) => actualizarItem(item.id, 'cantidad', e.target.value)} min="1" className="w-full text-xs px-2 py-1.5 bg-white border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-400 outline-none" />
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-400 font-bold block">PRECIO</label>
                                            <input type="number" value={item.precioUnitario} onChange={(e) => actualizarItem(item.id, 'precioUnitario', e.target.value)} min="0" step="0.01" className="w-full text-xs px-2 py-1.5 bg-white border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-400 outline-none" />
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-400 font-bold block">SUBTOTAL</label>
                                            <div className="text-xs px-2 py-1.5 bg-blue-50 border border-blue-100 rounded-md font-semibold text-blue-700">{formatCurrency(calcularSubtotal(item))}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Financiero */}
                    <div className="bg-white border border-gray-200 rounded-xl p-3 space-y-2">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Configuracion Financiera</p>
                        <div className="grid grid-cols-3 gap-2">
                            <div>
                                <label className="text-xs text-gray-400 font-semibold block mb-0.5">Moneda</label>
                                <select value={formData.moneda} onChange={(e) => setFormData({ ...formData, moneda: e.target.value })} className="w-full text-xs px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-400 outline-none">
                                    <option value="MXN">MXN</option>
                                    <option value="USD">USD</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 font-semibold block mb-0.5">IVA (%)</label>
                                <input type="number" value={formData.impuesto} onChange={(e) => setFormData({ ...formData, impuesto: e.target.value })} min="0" max="100" className="w-full text-xs px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-400 outline-none" />
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 font-semibold block mb-0.5">Descuento (%)</label>
                                <input type="number" value={formData.descuento} onChange={(e) => setFormData({ ...formData, descuento: e.target.value })} min="0" max="100" className="w-full text-xs px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-400 outline-none" />
                            </div>
                        </div>
                    </div>

                    {/* Notas */}
                    <div className="bg-white border border-gray-200 rounded-xl p-3 space-y-2">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Notas y Terminos</p>
                        <textarea value={formData.notas} onChange={(e) => setFormData({ ...formData, notas: e.target.value })} placeholder="Notas adicionales..." rows={2} className="w-full text-xs px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-400 outline-none resize-none" />
                        <textarea value={formData.terminosCondiciones} onChange={(e) => setFormData({ ...formData, terminosCondiciones: e.target.value })} placeholder="Terminos y condiciones..." rows={3} className="w-full text-xs px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-400 outline-none resize-none" />
                    </div>

                    <div className="h-6" />
                </div>
            </div>

            {/* RIGHT: Live preview of the document */}
            <div style={{ flex: 1, overflowY: 'auto' }} className="bg-gray-100 p-6 flex justify-center">
                <div className="w-full max-w-2xl bg-white shadow-2xl rounded-xl overflow-hidden">

                    {/* Doc Header */}
                    <div className="px-10 pt-8 pb-5 border-b-2 border-gray-200">
                        <div className="flex items-start justify-between">
                            <img src={logoImg} alt="Logo" className="h-12 object-contain" />
                            <div className="text-right">
                                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Cotizacion</div>
                                <div className="text-2xl font-bold text-blue-700 mt-0.5">{previewQuotationNumber}</div>
                            </div>
                        </div>
                        <div className="mt-4 text-xs text-gray-400 space-y-0.5">
                            <div>UPDM - Blvd. Rogelio Cantu Gomez 333-9, Col. Santa Maria, Monterrey N.L.</div>
                            <div>RFC: UPD141011MC3 | TEL: 813-557-3724 y 811-418-5412</div>
                        </div>
                    </div>

                    <div className="px-10 py-6 space-y-5">
                        {/* Titulo y fecha */}
                        <div>
                            <h2 className="text-base font-bold text-gray-700 uppercase tracking-widest text-center">Cotizacion</h2>
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                                <span>Fecha: {formData.fecha || '-'}</span>
                                <span>Valida por: {formData.validez || 30} dias</span>
                            </div>
                            {formData.creadoPor && <div className="text-xs text-gray-400 mt-0.5 text-center">Elaboro: {formData.creadoPor}</div>}
                            {formData.titulo && <div className="font-bold text-gray-800 text-sm mt-2">{formData.titulo}</div>}
                            {formData.descripcion && <div className="text-xs text-gray-500 mt-1">{formData.descripcion}</div>}
                        </div>

                        {/* Cliente box */}
                        <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Datos del Cliente</div>
                            <div className="text-xs space-y-0.5 text-gray-700">
                                {formData.clienteNombre
                                    ? <div><span className="font-bold">Cliente:</span> {formData.clienteNombre}</div>
                                    : <div className="text-gray-300 italic">Sin cliente...</div>}
                                {formData.clienteEmpresa && <div><span className="font-bold">Empresa:</span> {formData.clienteEmpresa}</div>}
                                {formData.clienteEmail && <div><span className="font-bold">Email:</span> {formData.clienteEmail}</div>}
                                {formData.clienteTelefono && <div><span className="font-bold">Tel:</span> {formData.clienteTelefono}</div>}
                                {formData.clienteDireccion && <div><span className="font-bold">Dir:</span> {formData.clienteDireccion}</div>}
                            </div>
                        </div>

                        {/* Tabla de items */}
                        <div className="overflow-hidden rounded-xl border border-gray-200">
                            <table className="w-full text-xs">
                                <thead className="bg-gray-700 text-white">
                                    <tr>
                                        <th className="px-4 py-2.5 text-left font-semibold">Descripcion</th>
                                        <th className="px-3 py-2.5 text-center font-semibold w-14">Cant.</th>
                                        <th className="px-3 py-2.5 text-right font-semibold w-24">Precio</th>
                                        <th className="px-3 py-2.5 text-right font-semibold w-24">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((item, i) => (
                                        <tr key={item.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                            <td className="px-4 py-2 border-t border-gray-100">{item.descripcion || <span className="text-gray-300 italic">sin descripcion</span>}</td>
                                            <td className="px-3 py-2 border-t border-gray-100 text-center">{item.cantidad}</td>
                                            <td className="px-3 py-2 border-t border-gray-100 text-right">{formatCurrency(item.precioUnitario)}</td>
                                            <td className="px-3 py-2 border-t border-gray-100 text-right font-semibold">{formatCurrency(calcularSubtotal(item))}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Totales */}
                        <div className="flex justify-end">
                            <div className="w-56 space-y-1 text-xs">
                                <div className="flex justify-between text-gray-600">
                                    <span>Subtotal:</span>
                                    <span className="font-semibold">{formatCurrency(calcularTotalItems())}</span>
                                </div>
                                {parseFloat(formData.descuento) > 0 && (
                                    <div className="flex justify-between text-red-500">
                                        <span>Descuento ({formData.descuento}%):</span>
                                        <span className="font-semibold">-{formatCurrency(calcularDescuento())}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-gray-600">
                                    <span>IVA ({formData.impuesto}%):</span>
                                    <span className="font-semibold">{formatCurrency(calcularImpuesto())}</span>
                                </div>
                                <div className="flex justify-between text-sm font-bold text-gray-800 pt-2 border-t-2 border-gray-700">
                                    <span>TOTAL:</span>
                                    <span>{formatCurrency(calcularTotal())}</span>
                                </div>
                                <div className="text-right text-gray-500">{formData.moneda}</div>
                            </div>
                        </div>

                        {/* Notas */}
                        {formData.notas && (
                            <div className="text-xs border-t pt-4">
                                <div className="font-bold text-gray-700 mb-1">Notas:</div>
                                <div className="text-gray-600">{formData.notas}</div>
                            </div>
                        )}

                        {/* T&C */}
                        {formData.terminosCondiciones && (
                            <div className="text-xs border-t pt-4">
                                <div className="font-bold text-gray-700 mb-1">Terminos y Condiciones:</div>
                                <div className="text-gray-500 leading-relaxed">{formData.terminosCondiciones}</div>
                            </div>
                        )}

                        {/* Footer del doc */}
                        <div className="border-t border-dashed pt-4 text-center text-xs text-gray-300">
                            UPDM - Documento generado por InfiniguardSYS
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
);
};

export default CrearCotizaciones;
