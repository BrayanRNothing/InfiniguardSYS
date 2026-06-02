import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast from 'react-hot-toast';
import logoUPDM from '../../assets/LOGOUPDM.png';
import logoInfiniguard from '../../assets/logoInfiniguard.png';
import { guardarCotizacionSimple, subirPDFCotizacion, obtenerProximoNumeroCotizacion } from '../../utils/documentStorage';
import API_URL from '../../config/api';
import { useLocation, useNavigate } from 'react-router-dom';

const CrearCotizaciones = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    // Determinar si estamos en modo edición
    const editData = location.state?.cotizacion || location.state?.Cotización;
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

    // Estado del logo seleccionado
    const [logoSeleccionado, setLogoSeleccionado] = useState(editData?.logo || 'UPDM');

    // Form data
    const [formData, setFormData] = useState({
        // Client info
        clienteNombre: editData?.cliente?.nombre || editData?.clienteNombre || '',
        clienteEmpresa: editData?.cliente?.empresa || editData?.clienteEmpresa || '',
        clienteEmail: editData?.cliente?.email || editData?.clienteEmail || '',
        clienteTelefono: editData?.cliente?.telefono || editData?.cliente?.['Teléfono'] || editData?.cliente?.['Tel\u00e9fono'] || editData?.clienteTelefono || '',
        clienteDireccion: editData?.cliente?.direccion || editData?.cliente?.['Dirección'] || editData?.cliente?.['Direcci\u00f3n'] || editData?.clienteDireccion || '',

        // Quotation info
        titulo: editData?.titulo || editData?.Título || '',
        descripcion: editData?.descripcion || editData?.Descripción || '',
        fecha: editData?.fecha ? new Date(editData.fecha).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        validez: editData?.validez || editData?.Válidez || '30', // días
        creadoPor: editData?.creadoPor || '', // Nombre de quien crea la cotización
        notas: editData?.notas || '', // Notas adicionales

        // Financial
        moneda: editData?.moneda || 'MXN', // MXN o USD
        impuesto: editData?.impuesto || '16', // IVA %
        descuento: editData?.descuento || '0', // %
        terminosCondiciones: editData?.terminosCondiciones || editData?.TérminosCondiciónes || 'Se requiere contar con toma de agua y suministro eléctrico cercanos para poder llevar a cabo el servicio de recubrimiento. Se otorga una garantía de 2 años contra la corrosión. En caso de que el serpentín sea reemplazado antes de que concluya dicho periodo, el serpentín sustituido será recubierto nuevamente sin costo adicional por nuestra parte.',
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
            toast.error('Debe haber al menos un concepto');
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
            toast.error('Todos los conceptos deben tener descripción');
            return false;
        }
        if (items.every(item => calcularSubtotal(item) === 0)) {
            toast.error('Debe haber al menos un concepto con precio');
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
                quotationNumber = previewQuotationNumber;
            } else {
                quotationNumber = await obtenerProximoNumeroCotizacion();
            }

            // Logo on the left
            let logoWidth = 40;
            let logoHeight = 20;
            const img = new Image();

            if (logoSeleccionado === 'INFINIGUARD') {
                img.src = logoInfiniguard;
                logoWidth = 60; // Más largo como pidió el usuario
                logoHeight = 18;
            } else {
                img.src = logoUPDM;
            }

            try {
                doc.addImage(img, 'PNG', 14, yPos, logoWidth, logoHeight);
            } catch (error) {
                console.warn('Error loading logo, using text fallback:', error);
                doc.setTextColor(60, 60, 60);
                doc.setFontSize(14);
                doc.setFont('helvetica', 'bold');
                doc.text(logoSeleccionado, 14, yPos + 10);
            }

            // Quotation number on the right
            doc.setTextColor(80, 80, 80);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text('Cotización', pageWidth - 14, yPos + 5, { align: 'right' });
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
            doc.text('Cotización', pageWidth / 2, yPos, { align: 'center' });

            yPos += 10;

            // Date and validity on the same line
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(`Fecha: ${formData.fecha}`, 14, yPos);
            doc.text(`Válida por: ${formData.validez} días`, pageWidth - 14, yPos, { align: 'right' });

            yPos += 7;

            // Issuer info below date
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(60, 60, 60);
            doc.text(`Emisor: ${logoSeleccionado === 'INFINIGUARD' ? 'INFINIGUARD' : 'UPDM'}`, 14, yPos);
            doc.setFont('helvetica', 'normal');
            doc.text('RFC: UPD141011MC3', pageWidth - 14, yPos, { align: 'right' });

            yPos += 5;
            doc.text('Blvd. Rogelio Cantú Gómez 333-9, col Santa María, Monterrey, N.L, 64650', 14, yPos);

            yPos += 5;
            doc.text('TEL: 813-557-3724 & 811-418-5412', 14, yPos);

            yPos += 7;
            doc.setFont('helvetica', 'bold');
            doc.text(`${formData.titulo}`, 14, yPos);

            yPos += 10;

            // Client Info Box
            const boxStartY = yPos;
            let boxContentHeight = 5;
            boxContentHeight += 4;

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
                boxContentHeight += 5 + (direccionLines.length - 1) * 4;
            }
            boxContentHeight += 4;

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
                yPos += (direccionLines.length - 1) * 4;
            }

            yPos += boxContentHeight - (yPos - boxStartY) + 12;

            // Description
            if (formData.descripcion) {
                doc.setFontSize(9);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(60, 60, 60);
                doc.text('Descripción:', 18, yPos);
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

            yPos += 15;

            // Pre-calculate space needed for notes and terms
            const pageHeight = doc.internal.pageSize.height;
            const footerHeight = 20;
            const maxY = pageHeight - footerHeight;

            let notasHeight = 0;
            let notasLines = [];
            if (formData.notas) {
                doc.setFontSize(8);
                notasLines = doc.splitTextToSize(formData.notas, pageWidth - 28);
                notasHeight = 10 + 6 + (notasLines.length * 4) + 12;
            }

            let termsHeight = 0;
            let termLines = [];
            if (formData.terminosCondiciones) {
                doc.setFontSize(8);
                termLines = doc.splitTextToSize(formData.terminosCondiciones, pageWidth - 28);
                termsHeight = 10 + 6 + (termLines.length * 4);
            }

            const totalContentHeight = notasHeight + termsHeight;
            const spaceAvailable = maxY - yPos;

            if (totalContentHeight > spaceAvailable && totalContentHeight < maxY - 20) {
                doc.addPage();
                yPos = 20;
            }

            // Notes section
            if (formData.notas) {
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
                yPos += notasLines.length * 4 + 12;
            }

            // Terms and Conditions
            if (formData.terminosCondiciones) {
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

            // Footer
            const footerY = doc.internal.pageSize.height - 15;
            doc.setFontSize(8);
            doc.setTextColor(128, 128, 128);

            if (formData.creadoPor) {
                doc.text(`Creado por: ${formData.creadoPor}`, 14, footerY);
            }

            // Save PDF locally
            const fileName = `${quotationNumber}_${formData.clienteNombre.replace(/\s+/g, '_')}.pdf`;
            doc.save(fileName);

            // Upload PDF
            const pdfBlob = doc.output('blob');
            const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });
            
            console.log('📤 Iniciando carga de PDF:', { fileName, size: pdfFile.size });
            const uploadRes = await subirPDFCotizacion(pdfFile);
            
            if (!uploadRes.url) {
                throw new Error('No se recibió URL del PDF después de subir');
            }
            
            console.log('✅ PDF cargado en:', uploadRes.url);

            // Save cotizacion data
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
                logo: logoSeleccionado,
                ...(isEditing && editData?.numero !== quotationNumber && { oldNumero: editData.numero })
            };

            console.log('💾 Guardando datos de cotización en BD:', { numero: quotationNumber, hasPdfUrl: !!uploadRes.url });
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
                pdfUrl: editData?.pdfUrl || null,
                logo: logoSeleccionado,
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
        <div className="flex flex-col w-full h-full overflow-hidden bg-slate-50 font-sans">
            {/* Header sticky */}
            <div style={{ flexShrink: 0 }} className="bg-white border-b border-slate-100 px-6 py-3 flex items-center justify-between z-40 shadow-sm">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/admin/documentos')} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors group">
                        <span className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-slate-100 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
                        </span>
                        Documentos
                    </button>
                    <span className="text-slate-300 font-light">/</span>
                    <span className="text-sm text-slate-400">Cotizaciones</span>
                    <span className="text-slate-300 font-light">/</span>
                    <span className="text-sm font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-md">{isEditing ? `Editando ${previewQuotationNumber}` : 'Nueva Cotización'}</span>
                </div>
                <div className="flex items-center gap-3">
                    {isEditing && (
                        <button onClick={handleCancelar} className="text-sm text-slate-500 hover:text-slate-700 font-semibold px-4 py-2 rounded-xl hover:bg-slate-50 transition-all">
                            Cancelar edición
                        </button>
                    )}
                    {isEditing && (
                        <button onClick={guardarSinDescargar} disabled={loading} className="flex items-center gap-2 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition-all disabled:opacity-50 shadow-sm shadow-blue-200">
                            {loading ? 'Guardando...' : 'Guardar cambios'}
                        </button>
                    )}
                    <button onClick={generarPDF} disabled={loading} className="flex items-center gap-2 text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl transition-all disabled:opacity-50 shadow-sm shadow-emerald-200">
                        {loading ? 'Procesando...' : 'Guardar y Descargar PDF'}
                    </button>
                </div>
            </div>

            {/* Split Layout: Form + Preview */}
            <div className="flex-1 flex overflow-hidden">

                {/* LEFT: Compact Form */}
                <div className="w-[420px] min-w-[380px] flex-shrink-0 overflow-y-auto bg-white border-r border-slate-100 p-6 flex flex-col gap-6 shadow-sm">

                    {/* Logo toggle */}
                    <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-4">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Logo en PDF</p>
                        <div className="flex gap-2">
                            <button onClick={() => setLogoSeleccionado('UPDM')} className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${logoSeleccionado === 'UPDM' ? 'bg-slate-800 text-white border-slate-800 shadow-sm' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}>UPDM</button>
                            <button onClick={() => setLogoSeleccionado('INFINIGUARD')} className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${logoSeleccionado === 'INFINIGUARD' ? 'bg-slate-800 text-white border-slate-800 shadow-sm' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}>Infiniguard</button>
                        </div>
                    </div>

                    {/* Cliente */}
                    <div className="flex flex-col gap-3">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Información del Cliente</p>
                        <div className="flex flex-col gap-2">
                            <input type="text" value={formData.clienteNombre} onChange={e => setFormData({...formData, clienteNombre: e.target.value})} placeholder="Nombre *" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50/80 placeholder:text-slate-400 transition-all" />
                            <input type="text" value={formData.clienteEmpresa} onChange={e => setFormData({...formData, clienteEmpresa: e.target.value})} placeholder="Empresa" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50/80 placeholder:text-slate-400 transition-all" />
                            <div className="grid grid-cols-2 gap-2">
                                <input type="email" value={formData.clienteEmail} onChange={e => setFormData({...formData, clienteEmail: e.target.value})} placeholder="Email" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50/80 placeholder:text-slate-400 transition-all" />
                                <input type="tel" value={formData.clienteTelefono} onChange={e => setFormData({...formData, clienteTelefono: e.target.value})} placeholder="Teléfono" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50/80 placeholder:text-slate-400 transition-all" />
                            </div>
                            <input type="text" value={formData.clienteDireccion} onChange={e => setFormData({...formData, clienteDireccion: e.target.value})} placeholder="Dirección" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50/80 placeholder:text-slate-400 transition-all" />
                        </div>
                    </div>

                    {/* Cotización */}
                    <div className="flex flex-col gap-3">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Detalles de Cotización</p>
                        <div className="flex flex-col gap-2">
                            <input type="text" value={formData.titulo} onChange={e => setFormData({...formData, titulo: e.target.value})} placeholder="Título *" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50/80 placeholder:text-slate-400 transition-all" />
                            <div className="grid grid-cols-2 gap-2">
                                <input type="text" value={formData.creadoPor} onChange={e => setFormData({...formData, creadoPor: e.target.value})} placeholder="Atendido por" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50/80 placeholder:text-slate-400 transition-all" />
                                <input type="date" value={formData.fecha} onChange={e => setFormData({...formData, fecha: e.target.value})} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50/80 text-slate-600 transition-all" />
                            </div>
                            <textarea value={formData.descripcion} onChange={e => setFormData({...formData, descripcion: e.target.value})} placeholder="Descripción (opcional)" rows={2} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50/80 placeholder:text-slate-400 resize-none transition-all" />
                        </div>
                    </div>

                    {/* Conceptos */}
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Conceptos</p>
                            <button onClick={agregarItem} className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-2.5 py-1.5 rounded-lg transition-all hover:bg-blue-100 flex items-center gap-1">+ Agregar</button>
                        </div>
                        <div className="flex flex-col gap-2">
                            {items.map((item, idx) => (
                                <div key={item.id} className="group border border-slate-150 rounded-xl p-3 bg-slate-50/80 flex flex-col gap-2.5 transition-all hover:border-slate-300">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-slate-400 bg-slate-200 w-5 h-5 rounded-full flex items-center justify-center">{idx + 1}</span>
                                        <input type="text" value={item.descripcion} onChange={e => actualizarItem(item.id, 'descripcion', e.target.value)} placeholder="Descripción del concepto *" className="flex-1 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-blue-400 bg-white placeholder:text-slate-400" />
                                        {items.length > 1 && (
                                            <button onClick={() => eliminarItem(item.id)} className="text-slate-400 hover:text-red-500 transition-all p-1" title="Eliminar concepto">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                            </button>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        <div>
                                            <label className="text-[9px] text-slate-400 font-bold ml-1">Cant.</label>
                                            <input type="number" value={item.cantidad} onChange={e => actualizarItem(item.id, 'cantidad', e.target.value)} min="1" className="w-full border border-slate-200 rounded-lg px-2 py-1 text-xs outline-none focus:border-blue-400 bg-white text-center font-semibold" />
                                        </div>
                                        <div>
                                            <label className="text-[9px] text-slate-400 font-bold ml-1">Precio Unit.</label>
                                            <div className="relative">
                                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">$</span>
                                                <input type="number" value={item.precioUnitario} onChange={e => actualizarItem(item.id, 'precioUnitario', e.target.value)} min="0" step="0.01" className="w-full border border-slate-200 rounded-lg pl-4 pr-1 py-1 text-xs outline-none focus:border-blue-400 bg-white font-semibold text-right" />
                                            </div>
                                        </div>
                                        <div className="flex flex-col justify-end">
                                            <label className="text-[9px] text-slate-400 font-bold ml-1">Subtotal</label>
                                            <div className="border border-blue-100 bg-blue-50/50 rounded-lg px-2 py-1 text-xs font-bold text-blue-700 text-right">
                                                {formatCurrency(calcularSubtotal(item)).split(' ')[0]}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Configuración */}
                    <div className="flex flex-col gap-3">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Configuración Financiera</p>
                        <div className="grid grid-cols-2 gap-2 bg-slate-50/50 border border-slate-100 rounded-xl p-3.5">
                            <div>
                                <label className="text-[9px] text-slate-400 font-bold ml-1">Moneda</label>
                                <select value={formData.moneda} onChange={e => setFormData({...formData, moneda: e.target.value})} className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-blue-400 bg-white text-slate-700 font-semibold">
                                    <option value="MXN">MXN</option>
                                    <option value="USD">USD</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-[9px] text-slate-400 font-bold ml-1">Validez (días)</label>
                                <input type="number" value={formData.validez} onChange={e => setFormData({...formData, validez: e.target.value})} min="1" className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-blue-400 text-center font-semibold" />
                            </div>
                            <div>
                                <label className="text-[9px] text-slate-400 font-bold ml-1">IVA (%)</label>
                                <input type="number" value={formData.impuesto} onChange={e => setFormData({...formData, impuesto: e.target.value})} min="0" max="100" className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-blue-400 text-center font-semibold" />
                            </div>
                            <div>
                                <label className="text-[9px] text-slate-400 font-bold ml-1">Descuento (%)</label>
                                <input type="number" value={formData.descuento} onChange={e => setFormData({...formData, descuento: e.target.value})} min="0" max="100" className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-blue-400 text-center font-semibold" />
                            </div>
                        </div>
                    </div>

                    {/* Notas y Términos */}
                    <div className="flex flex-col gap-3 mb-4">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Notas y Términos</p>
                        <div className="flex flex-col gap-2.5">
                            <textarea value={formData.notas} onChange={e => setFormData({...formData, notas: e.target.value})} placeholder="Notas adicionales..." rows={2} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50/80 placeholder:text-slate-400 resize-none transition-all" />
                            <textarea value={formData.terminosCondiciones} onChange={e => setFormData({...formData, terminosCondiciones: e.target.value})} placeholder="Términos y condiciones..." rows={3} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50/80 placeholder:text-slate-400 resize-none transition-all" />
                        </div>
                    </div>
                </div>

                {/* RIGHT: Live Preview (Faithful layout mimicking the jsPDF layout) */}
                <div className="flex-1 overflow-y-auto bg-slate-100 flex items-start justify-center p-8">
                    <div className="bg-white w-full max-w-[720px] shadow-lg border border-slate-200/60 rounded-sm p-10 min-h-[960px] flex flex-col justify-between" style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
                        
                        <div>
                            {/* Header del documento (Fiel a jsPDF) */}
                            <div className="flex items-start justify-between">
                                <div>
                                    {logoSeleccionado === 'INFINIGUARD'
                                        ? <img src={logoInfiniguard} alt="Infiniguard" className="h-12 object-contain object-left" style={{ maxWidth: '280px' }} />
                                        : <img src={logoUPDM} alt="UPDM" className="h-12 object-contain object-left" style={{ maxWidth: '180px' }} />
                                    }
                                </div>
                                <div className="text-right flex flex-col items-end">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cotización</span>
                                    <span className="text-2xl font-bold text-slate-800 font-mono mt-0.5">{previewQuotationNumber}</span>
                                </div>
                            </div>

                            {/* Separator line */}
                            <div className="border-b border-gray-300 w-full my-4"></div>

                            {/* Date, validity, issuer info */}
                            <div className="text-[10px] text-slate-700 leading-normal">
                                <div className="flex justify-between">
                                    <div>Fecha: {formData.fecha}</div>
                                    <div>Válida por: {formData.validez} días</div>
                                </div>
                                <div className="flex justify-between mt-1">
                                    <div><span className="font-bold">Emisor:</span> {logoSeleccionado === 'INFINIGUARD' ? 'INFINIGUARD' : 'UPDM'}</div>
                                    <div>RFC: UPD141011MC3</div>
                                </div>
                                <div className="text-[9px] text-slate-500 mt-1">
                                    <div>Blvd. Rogelio Cantú Gómez 333-9, col Santa María, Monterrey, N.L, 64650</div>
                                    <div>TEL: 813-557-3724 & 811-418-5412</div>
                                </div>
                            </div>

                            {/* Título de Cotización */}
                            {formData.titulo && (
                                <div className="mt-4">
                                    <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">{formData.titulo}</h2>
                                </div>
                            )}

                            {/* Caja del cliente (Estilo exacto de jsPDF) */}
                            <div className="mt-4 bg-slate-50 border border-gray-300 rounded-lg p-4 text-[11px] text-slate-700">
                                <div className="grid grid-cols-[80px_1fr] gap-x-2 gap-y-1">
                                    <span className="font-bold text-slate-800">CLIENTE:</span>
                                    <span className="text-slate-800 font-bold">{formData.clienteNombre || '—'}</span>
                                    {formData.clienteEmpresa && (
                                        <>
                                            <span className="font-bold text-slate-800">Empresa:</span>
                                            <span className="text-slate-800">{formData.clienteEmpresa}</span>
                                        </>
                                    )}
                                    {formData.clienteEmail && (
                                        <>
                                            <span className="font-bold text-slate-800">Email:</span>
                                            <span className="text-slate-850">{formData.clienteEmail}</span>
                                        </>
                                    )}
                                    {formData.clienteTelefono && (
                                        <>
                                            <span className="font-bold text-slate-800">Teléfono:</span>
                                            <span className="text-slate-855">{formData.clienteTelefono}</span>
                                        </>
                                    )}
                                    {formData.clienteDireccion && (
                                        <>
                                            <span className="font-bold text-slate-800">Dirección:</span>
                                            <span className="text-slate-855">{formData.clienteDireccion}</span>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Descripción de Cotización (Debajo de caja cliente y arriba de tabla) */}
                            {formData.descripcion && (
                                <div className="mt-4">
                                    <span className="text-xs font-bold text-slate-700">Descripción:</span>
                                    <p className="text-[11px] text-slate-600 mt-1 leading-relaxed whitespace-pre-wrap">{formData.descripcion}</p>
                                </div>
                            )}

                            {/* Tabla de Conceptos (Fiel al autoTable de jsPDF) */}
                            <div className="mt-6">
                                <table className="w-full border-collapse text-[10px] text-slate-700 border border-gray-300">
                                    <thead>
                                        <tr className="text-white" style={{ backgroundColor: '#646464' }}>
                                            <th className="text-left px-3 py-2 font-bold border border-gray-300">Descripción</th>
                                            <th className="text-center px-3 py-2 font-bold w-16 border border-gray-300">Cantidad</th>
                                            <th className="text-right px-3 py-2 font-bold w-24 border border-gray-300">Precio Unit.</th>
                                            <th className="text-right px-3 py-2 font-bold w-24 border border-gray-300">Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {items.map((item, idx) => (
                                            <tr key={item.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                                                <td className="px-3 py-2 leading-tight text-slate-800 border border-gray-300">
                                                    {item.descripcion || <span className="text-slate-300 italic">Sin descripción</span>}
                                                </td>
                                                <td className="px-3 py-2 text-center text-slate-700 border border-gray-300">{item.cantidad}</td>
                                                <td className="px-3 py-2 text-right text-slate-700 border border-gray-300">{formatCurrency(parseFloat(item.precioUnitario) || 0)}</td>
                                                <td className="px-3 py-2 text-right font-semibold text-slate-800 border border-gray-300">{formatCurrency(calcularSubtotal(item))}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Totales (Derecha, Fiel a jsPDF) */}
                            <div className="flex justify-end mt-4 text-[10px]">
                                <div className="w-56 flex flex-col gap-1 text-slate-700">
                                    <div className="flex justify-between">
                                        <span>Subtotal:</span>
                                        <span className="font-mono font-medium">{formatCurrency(calcularTotalItems())}</span>
                                    </div>
                                    {parseFloat(formData.descuento) > 0 && (
                                        <div className="flex justify-between text-emerald-600 font-medium">
                                            <span>Descuento ({formData.descuento}%):</span>
                                            <span className="font-mono font-medium">-{formatCurrency(calcularDescuento())}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between">
                                        <span>IVA ({formData.impuesto}%):</span>
                                        <span className="font-mono font-medium">{formatCurrency(calcularImpuesto())}</span>
                                    </div>
                                    <div className="border-t-2 border-slate-700 mt-1 pt-1 flex justify-between items-center">
                                        <span className="font-bold text-slate-850">TOTAL:</span>
                                        <span className="font-mono text-[11px] font-bold text-slate-900">{formatCurrency(calcularTotal())}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Notas */}
                            {formData.notas && (
                                <div className="mt-8">
                                    <div className="text-[10px] font-bold text-slate-800 mb-1">NOTAS:</div>
                                    <p className="text-[10px] text-slate-700 leading-relaxed whitespace-pre-wrap">{formData.notas}</p>
                                </div>
                            )}

                            {/* Términos y Condiciones */}
                            {formData.terminosCondiciones && (
                                <div className="mt-6">
                                    <div className="text-[10px] font-bold text-slate-800 mb-1">TÉRMINOS Y CONDICIONES:</div>
                                    <p className="text-[9px] text-slate-655 leading-relaxed whitespace-pre-wrap">{formData.terminosCondiciones}</p>
                                </div>
                            )}
                        </div>

                        {/* Footer (Fiel a jsPDF) */}
                        <div className="border-t border-slate-200 pt-4 flex justify-between items-center mt-10 text-[9px] text-slate-400">
                            <div>{formData.creadoPor ? `Creado por: ${formData.creadoPor}` : ''}</div>
                            <div className="font-semibold text-slate-300">Generado por InfiniguardSYS</div>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
};

export default CrearCotizaciones;
