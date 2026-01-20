import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import logoImg from '../../assets/LOGOUPDM.png';

function CrearOrdenTrabajo() {
    const navigate = useNavigate();

    // Estado del formulario
    const [formData, setFormData] = useState({
        // Información General
        fecha: new Date().toISOString().split('T')[0],
        fechaProgramada: '',
        fechaFinalizacion: '',
        telefono: '446 133-3079',
        fax: '446',
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
        viaEmbarque: '',

        // Detalles del trabajo
        descripcionTrabajo: '',
        tecnicoAsignado: '',
        observaciones: ''
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
            const margin = 12;
            let yPos = margin;

            // Generate incremental order number
            let currentOrderNumber = parseInt(localStorage.getItem('lastOrderNumber') || '3871', 10);
            currentOrderNumber += 1;
            localStorage.setItem('lastOrderNumber', currentOrderNumber.toString());

            // === 1. HEADER SUPERIOR (FLEX CONTAINER) ===
            // Left side - Logo and company data
            const logoWidth = 28;
            const logoHeight = 14;

            const img = new Image();
            img.src = logoImg;

            try {
                doc.addImage(img, 'PNG', margin, yPos, logoWidth, logoHeight);
            } catch (error) {
                console.warn('Error loading logo:', error);
            }

            // Company data below logo
            doc.setFontSize(7);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(60, 60, 60);
            doc.text('UPDM', margin, yPos + 17);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(6);
            doc.text('Blvd. Rogelio Cantú Gómez 333-9', margin, yPos + 20);
            doc.text('Col. Santa María, Monterrey, N.L', margin, yPos + 23);
            doc.text('RFC: UPD141011MC3', margin, yPos + 26);
            doc.text('Tel: 813-557-3724 & 811-418-5412', margin, yPos + 29);

            // Right side - Title and key data
            const rightX = pageWidth - margin;
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(40, 40, 40);
            doc.text('ORDEN DE TRABAJO', rightX, yPos + 6, { align: 'right' });

            // Key data list
            doc.setFontSize(7);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(60, 60, 60);

            const fechaFormateada = new Date(formData.fecha + 'T00:00:00').toLocaleDateString('es-MX', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            doc.text(`Fecha: ${fechaFormateada}`, rightX, yPos + 12, { align: 'right' });
            doc.setFont('helvetica', 'bold');
            doc.text(`Número de Orden: ${currentOrderNumber}`, rightX, yPos + 16, { align: 'right' });
            doc.setFont('helvetica', 'normal');
            doc.text(`Orden de Compra: ${formData.ordenCompra || 'N/A'}`, rightX, yPos + 20, { align: 'right' });
            doc.text(`Sucursal: ${formData.sucursal}`, rightX, yPos + 24, { align: 'right' });
            doc.text(`Almacén: ${formData.almacen}`, rightX, yPos + 28, { align: 'right' });

            yPos += 34;

            // Separator line
            doc.setDrawColor(150, 150, 150);
            doc.setLineWidth(0.5);
            doc.line(margin, yPos, pageWidth - margin, yPos);
            yPos += 5;

            // === 2. SECCIÓN DE DIRECCIONES (GRID 2 COLUMNAS) ===
            const col1Width = (pageWidth - 2 * margin) / 2 - 2;
            const col2X = margin + col1Width + 4;
            const addressStartY = yPos;

            // Column 1 - "Vendido a"
            doc.setFillColor(240, 240, 240);
            doc.rect(margin, yPos, col1Width, 5, 'F');
            doc.setFontSize(7);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(40, 40, 40);
            doc.text('Vendido a:', margin + 2, yPos + 3.5);

            yPos += 7;
            doc.setFontSize(6.5);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(60, 60, 60);

            // Client name
            if (formData.cliente) {
                const clienteLines = doc.splitTextToSize(formData.cliente, col1Width - 4);
                doc.text(clienteLines, margin + 2, yPos);
                yPos += clienteLines.length * 3;
            }

            // RFC
            doc.setFont('helvetica', 'bold');
            doc.text('RFC:', margin + 2, yPos);
            doc.setFont('helvetica', 'normal');
            doc.text(formData.claveCliente || 'N/A', margin + 10, yPos);
            yPos += 3;

            // Address
            doc.setFont('helvetica', 'bold');
            doc.text('Dirección:', margin + 2, yPos);
            yPos += 2.5;
            doc.setFont('helvetica', 'normal');
            if (formData.direccion) {
                const dirLines = doc.splitTextToSize(formData.direccion, col1Width - 4);
                doc.text(dirLines, margin + 2, yPos);
                yPos += dirLines.length * 3;
            }

            // Column 2 - "Entregar a"
            let col2Y = addressStartY;

            doc.setFillColor(240, 240, 240);
            doc.rect(col2X, col2Y, col1Width, 5, 'F');
            doc.setFontSize(7);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(40, 40, 40);
            doc.text('Entregar a:', col2X + 2, col2Y + 3.5);

            col2Y += 7;
            doc.setFontSize(6.5);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(60, 60, 60);

            // Delivery name
            if (formData.cliente) {
                const deliveryLines = doc.splitTextToSize(formData.cliente, col1Width - 4);
                doc.text(deliveryLines, col2X + 2, col2Y);
                col2Y += deliveryLines.length * 3;
            }

            // Delivery address
            doc.setFont('helvetica', 'bold');
            doc.text('Dirección:', col2X + 2, col2Y);
            col2Y += 2.5;
            doc.setFont('helvetica', 'normal');
            if (formData.direccion) {
                const deliveryDirLines = doc.splitTextToSize(formData.direccion, col1Width - 4);
                doc.text(deliveryDirLines, col2X + 2, col2Y);
                col2Y += deliveryDirLines.length * 3;
            }

            yPos = Math.max(yPos, col2Y) + 4;

            // === 3. BARRA DE INFORMACIÓN (GRID 5 COLUMNAS) ===
            const barHeight = 9;
            doc.setFillColor(230, 230, 230);
            doc.rect(margin, yPos, pageWidth - 2 * margin, barHeight, 'F');

            const colWidth = (pageWidth - 2 * margin) / 5;
            doc.setFontSize(5.5);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(40, 40, 40);

            let barX = margin + 1.5;

            // Clave del Cliente
            doc.text('Clave del Cliente', barX, yPos + 2.5);
            doc.setFont('helvetica', 'normal');
            doc.text(formData.claveCliente || 'N/A', barX, yPos + 6);
            barX += colWidth;

            // Contacto
            doc.setFont('helvetica', 'bold');
            doc.text('Contacto', barX, yPos + 2.5);
            doc.setFont('helvetica', 'normal');
            const contacto = doc.splitTextToSize(formData.contacto || 'N/A', colWidth - 3);
            doc.text(contacto[0], barX, yPos + 6);
            barX += colWidth;

            // Vía de Embarque
            doc.setFont('helvetica', 'bold');
            doc.text('Vía de Embarque', barX, yPos + 2.5);
            doc.setFont('helvetica', 'normal');
            const via = doc.splitTextToSize(formData.viaEmbarque || 'N/A', colWidth - 3);
            doc.text(via[0], barX, yPos + 6);
            barX += colWidth;

            // Vendedor
            doc.setFont('helvetica', 'bold');
            doc.text('Vendedor', barX, yPos + 2.5);
            doc.setFont('helvetica', 'normal');
            const vendedor = doc.splitTextToSize(formData.vendedor || 'N/A', colWidth - 3);
            doc.text(vendedor[0], barX, yPos + 6);
            barX += colWidth;

            // Condiciones
            doc.setFont('helvetica', 'bold');
            doc.text('Condiciones', barX, yPos + 2.5);
            doc.setFont('helvetica', 'normal');
            const condiciones = doc.splitTextToSize(formData.condiciones || 'N/A', colWidth - 3);
            doc.text(condiciones[0], barX, yPos + 6);

            yPos += barHeight + 5;

            // === 4. TABLA DE PRODUCTOS ===
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(40, 40, 40);
            doc.text('PRODUCTOS / SERVICIOS', margin, yPos);
            yPos += 4;

            // Table header
            doc.setFillColor(80, 80, 80);
            doc.rect(margin, yPos, pageWidth - 2 * margin, 6, 'F');

            doc.setFontSize(6);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(255, 255, 255);
            doc.text('Cant.', margin + 2, yPos + 4);
            doc.text('Unidad', margin + 14, yPos + 4);
            doc.text('Atrib.', margin + 28, yPos + 4);
            doc.text('Clave', margin + 42, yPos + 4);
            doc.text('Producto', margin + 70, yPos + 4);
            doc.text('F. Entrega', pageWidth - margin - 28, yPos + 4);
            doc.text('Real', pageWidth - margin - 12, yPos + 4);
            yPos += 8;

            // Table rows
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(60, 60, 60);
            doc.setFontSize(6);

            items.forEach((item, index) => {
                if (yPos > pageHeight - 60) {
                    doc.addPage();
                    yPos = margin;
                }

                // Alternate row background
                if (index % 2 === 0) {
                    doc.setFillColor(250, 250, 250);
                    doc.rect(margin, yPos - 2, pageWidth - 2 * margin, 6, 'F');
                }

                doc.text(item.cantidad.toString(), margin + 2, yPos);
                doc.text((item.unidad || '').substring(0, 8), margin + 14, yPos);
                doc.text((item.atributos || '').substring(0, 8), margin + 28, yPos);
                doc.text((item.clave || '').substring(0, 15), margin + 42, yPos);

                const descripcionLines = doc.splitTextToSize(item.descripcion || '', 80);
                doc.text(descripcionLines, margin + 70, yPos);

                doc.text(item.fechaEntrega || '', pageWidth - margin - 28, yPos);

                yPos += Math.max(6, descripcionLines.length * 3);
            });

            yPos += 6;

            // === 5. RECUADRO DE REPORTE DE CAMPO ===
            if (yPos > pageHeight - 50) {
                doc.addPage();
                yPos = margin;
            }

            // Border box
            const reportBoxHeight = 45;
            doc.setDrawColor(0, 0, 0);
            doc.setLineWidth(1);
            doc.rect(margin, yPos, pageWidth - 2 * margin, reportBoxHeight);

            yPos += 4;
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(40, 40, 40);
            doc.text('REPORTE DE CAMPO', margin + 3, yPos);

            yPos += 5;
            doc.setFontSize(6);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(60, 60, 60);

            // Two columns for fields
            const fieldCol1X = margin + 3;
            const fieldCol2X = pageWidth / 2 + 2;
            let fieldY = yPos;

            // Left column
            doc.setFont('helvetica', 'bold');
            doc.text('Fecha de ejecución:', fieldCol1X, fieldY);
            doc.setFont('helvetica', 'normal');
            doc.line(fieldCol1X + 28, fieldY, fieldCol1X + 80, fieldY);
            fieldY += 4;

            doc.setFont('helvetica', 'bold');
            doc.text('Cliente:', fieldCol1X, fieldY);
            doc.setFont('helvetica', 'normal');
            doc.line(fieldCol1X + 12, fieldY, fieldCol1X + 80, fieldY);
            fieldY += 4;

            doc.setFont('helvetica', 'bold');
            doc.text('Aplicador (Nombres):', fieldCol1X, fieldY);
            doc.setFont('helvetica', 'normal');
            doc.line(fieldCol1X + 30, fieldY, fieldCol1X + 80, fieldY);
            fieldY += 4;

            // Right column
            fieldY = yPos;
            doc.setFont('helvetica', 'bold');
            doc.text('Ayudantes (Nombres):', fieldCol2X, fieldY);
            doc.setFont('helvetica', 'normal');
            doc.line(fieldCol2X + 32, fieldY, pageWidth - margin - 3, fieldY);
            fieldY += 4;

            doc.setFont('helvetica', 'bold');
            doc.text('Hrs. Trabajo:', fieldCol2X, fieldY);
            doc.setFont('helvetica', 'normal');
            doc.line(fieldCol2X + 18, fieldY, pageWidth - margin - 3, fieldY);
            fieldY += 4;

            doc.setFont('helvetica', 'bold');
            doc.text('Consumo Total:', fieldCol2X, fieldY);
            doc.setFont('helvetica', 'normal');
            doc.line(fieldCol2X + 22, fieldY, pageWidth - margin - 3, fieldY);
            fieldY += 4;

            yPos = Math.max(fieldY, yPos + 12) + 2;

            // Comentarios
            doc.setFont('helvetica', 'bold');
            doc.text('Comentarios:', margin + 3, yPos);
            yPos += 3;
            doc.setFont('helvetica', 'normal');
            for (let i = 0; i < 3; i++) {
                doc.line(margin + 3, yPos, pageWidth - margin - 3, yPos);
                yPos += 3.5;
            }

            // Footer
            yPos = pageHeight - 8;
            doc.setFontSize(6);
            doc.setTextColor(120, 120, 120);
            doc.text('UPDM - Blvd. Rogelio Cantú Gómez 333-9, Monterrey, N.L | Tel: 813-557-3724 & 811-418-5412 | RFC: UPD141011MC3', pageWidth / 2, yPos, { align: 'center' });

            // Save PDF
            const fileName = `Orden_Trabajo_${currentOrderNumber}_${formData.cliente.replace(/\s+/g, '_')}.pdf`;
            doc.save(fileName);

            toast.success('PDF generado exitosamente', { id: loadingToast });
        } catch (error) {
            console.error('Error generando PDF:', error);
            toast.error('Error al generar el PDF', { id: loadingToast });
        }
    };


    return (
        <div className="max-w-7xl mx-auto">

            const pageHeight = doc.internal.pageSize.height;
            const margin = 15;
            let yPos = margin;

            // Generate incremental order number
            let currentOrderNumber = parseInt(localStorage.getItem('lastOrderNumber') || '3871', 10);
            currentOrderNumber += 1;
            localStorage.setItem('lastOrderNumber', currentOrderNumber.toString());

            // === PROFESSIONAL HEADER ===
            // Logo on the left
            const logoWidth = 35;
            const logoHeight = 18;

            const img = new Image();
            img.src = logoImg;

            try {
                doc.addImage(img, 'PNG', margin, yPos, logoWidth, logoHeight);
    } catch (error) {
                console.warn('Error loading logo:', error);
    }

            // Title and order number on the right
            doc.setTextColor(60, 60, 60);
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('ORDEN DE TRABAJO', pageWidth - margin, yPos + 6, {align: 'right' });

            doc.setFontSize(18);
            doc.setTextColor(40, 40, 40);
            doc.text(currentOrderNumber.toString(), pageWidth - margin, yPos + 14, {align: 'right' });

            yPos += 22;

            // Date
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(80, 80, 80);
            const fechaFormateada = new Date(formData.fecha + 'T00:00:00').toLocaleDateString('es-MX', {
                year: 'numeric',
            month: 'long',
            day: 'numeric'
    });
            doc.text(fechaFormateada, pageWidth - margin, yPos, {align: 'right' });

            yPos += 8;

            // Separator line
            doc.setDrawColor(180, 180, 180);
            doc.setLineWidth(0.5);
            doc.line(margin, yPos, pageWidth - margin, yPos);

            yPos += 8;

            // Company info
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(60, 60, 60);
            doc.text('Emisor: UPDM', margin, yPos);
            doc.setFont('helvetica', 'normal');
            doc.text('RFC: UPD141011MC3', pageWidth - margin, yPos, {align: 'right' });

            yPos += 4;
            doc.setFontSize(7);
            doc.text('Blvd. Rogelio Cantú Gómez 333-9, Col. Santa María, Monterrey, N.L, 64650', margin, yPos);

            yPos += 3;
            doc.text('TEL: 813-557-3724 & 811-418-5412', margin, yPos);

            yPos += 8;

            // === CLIENT INFORMATION BOX ===
            const boxStartY = yPos;
            const boxHeight = 45;

            // Draw box
            doc.setDrawColor(200, 200, 200);
            doc.setLineWidth(0.3);
            doc.rect(margin, boxStartY, pageWidth - 2 * margin, boxHeight);

            // Vertical divider
            const middleX = pageWidth / 2;
            doc.line(middleX, boxStartY, middleX, boxStartY + boxHeight);

            yPos = boxStartY + 6;

            // Left side - CLIENT
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(40, 40, 40);
            doc.text('CLIENTE', margin + 3, yPos);

            yPos += 5;
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(60, 60, 60);

            const leftColWidth = (pageWidth / 2) - margin - 6;

            if (formData.cliente) {
        const clienteLines = doc.splitTextToSize(formData.cliente, leftColWidth);
            doc.text(clienteLines, margin + 3, yPos);
            yPos += clienteLines.length * 3.5;
    }

            yPos += 2;
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(7);
            doc.text('Clave:', margin + 3, yPos);
            doc.setFont('helvetica', 'normal');
            doc.text(formData.claveCliente || 'N/A', margin + 15, yPos);

            yPos += 3.5;
            doc.setFont('helvetica', 'bold');
            doc.text('Contacto:', margin + 3, yPos);
            doc.setFont('helvetica', 'normal');
            doc.text(formData.contacto || 'N/A', margin + 15, yPos);

            yPos += 3.5;
            doc.setFont('helvetica', 'bold');
            doc.text('Vendedor:', margin + 3, yPos);
            doc.setFont('helvetica', 'normal');
            doc.text(formData.vendedor || 'N/A', margin + 15, yPos);

            // Right side - DELIVERY INFO
            let rightY = boxStartY + 6;
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(40, 40, 40);
            doc.text('INFORMACIÓN DE ENTREGA', middleX + 3, rightY);

            rightY += 5;
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(60, 60, 60);

            const rightColWidth = (pageWidth / 2) - margin - 6;

            if (formData.direccion) {
        const direccionLines = doc.splitTextToSize(formData.direccion, rightColWidth);
            doc.text(direccionLines, middleX + 3, rightY);
            rightY += direccionLines.length * 3.5;
    }

            rightY += 2;
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(7);
            doc.text('Estado:', middleX + 3, rightY);
            doc.setFont('helvetica', 'normal');
            doc.text(formData.estado, middleX + 15, rightY);

            rightY += 3.5;
            doc.setFont('helvetica', 'bold');
            doc.text('Vía:', middleX + 3, rightY);
            doc.setFont('helvetica', 'normal');
            doc.text(formData.viaEmbarque || 'N/A', middleX + 15, rightY);

            yPos = boxStartY + boxHeight + 8;

            // === DATES BOX ===
            const datesBoxHeight = 12;
            doc.setDrawColor(200, 200, 200);
            doc.rect(margin, yPos, pageWidth - 2 * margin, datesBoxHeight);

            // Vertical dividers for 4 columns
            const col1X = margin + (pageWidth - 2 * margin) / 4;
            const col2X = margin + 2 * (pageWidth - 2 * margin) / 4;
            const col3X = margin + 3 * (pageWidth - 2 * margin) / 4;

            doc.line(col1X, yPos, col1X, yPos + datesBoxHeight);
            doc.line(col2X, yPos, col2X, yPos + datesBoxHeight);
            doc.line(col3X, yPos, col3X, yPos + datesBoxHeight);

            const dateY = yPos + 4;
            doc.setFontSize(7);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(60, 60, 60);

            doc.text('Emisión:', margin + 2, dateY);
            doc.setFont('helvetica', 'normal');
            doc.text(formData.fecha, margin + 2, dateY + 4);

            doc.setFont('helvetica', 'bold');
            doc.text('Programada:', col1X + 2, dateY);
            doc.setFont('helvetica', 'normal');
            doc.text(formData.fechaProgramada || '__/__/__', col1X + 2, dateY + 4);

            doc.setFont('helvetica', 'bold');
            doc.text('Finalización:', col2X + 2, dateY);
            doc.setFont('helvetica', 'normal');
            doc.text(formData.fechaFinalizacion || '__/__/__', col2X + 2, dateY + 4);

            doc.setFont('helvetica', 'bold');
            doc.text('Almacén/Sucursal:', col3X + 2, dateY);
            doc.setFont('helvetica', 'normal');
            doc.text(`${formData.almacen}/${formData.sucursal}`, col3X + 2, dateY + 4);

            yPos += datesBoxHeight + 8;

            // === PRODUCTS TABLE (IMPROVED) ===
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(40, 40, 40);
            doc.text('PRODUCTOS / SERVICIOS', margin, yPos);
            yPos += 6;

            // Table header with dark background
            doc.setFillColor(80, 80, 80);
            doc.rect(margin, yPos, pageWidth - 2 * margin, 7, 'F');

            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(255, 255, 255);
            doc.text('#', margin + 2, yPos + 4.5);
            doc.text('Cant.', margin + 10, yPos + 4.5);
            doc.text('Descripción', margin + 25, yPos + 4.5);
            doc.text('Unidad', pageWidth - margin - 20, yPos + 4.5);
            yPos += 9;

            // Table rows
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(60, 60, 60);
            doc.setFontSize(8);

    items.forEach((item, index) => {
        if (yPos > pageHeight - 60) {
                doc.addPage();
            yPos = margin;
        }

            // Alternate row background
            if (index % 2 === 0) {
                doc.setFillColor(250, 250, 250);
            const rowHeight = Math.max(6, doc.splitTextToSize(item.descripcion || '-', 120).length * 4);
            doc.rect(margin, yPos - 2, pageWidth - 2 * margin, rowHeight, 'F');
        }

            doc.text((index + 1).toString(), margin + 2, yPos);
            doc.text(item.cantidad.toString(), margin + 10, yPos);

            const descripcionLines = doc.splitTextToSize(item.descripcion || '-', 120);
            doc.text(descripcionLines, margin + 25, yPos);

            doc.text((item.unidad || '-').substring(0, 10), pageWidth - margin - 20, yPos);

            yPos += Math.max(6, descripcionLines.length * 4);
    });

            yPos += 8;

            // === WORK DESCRIPTION SECTION ===
            if (formData.descripcionTrabajo) {
        if (yPos > pageHeight - 40) {
                doc.addPage();
            yPos = margin;
        }

            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(40, 40, 40);
            doc.text('DESCRIPCIÓN DEL SERVICIO', margin, yPos);
            yPos += 6;

            doc.setDrawColor(200, 200, 200);
            doc.setLineWidth(0.3);
            const descBoxHeight = 20;
            doc.rect(margin, yPos, pageWidth - 2 * margin, descBoxHeight);

            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(60, 60, 60);
            const descLines = doc.splitTextToSize(formData.descripcionTrabajo, pageWidth - 2 * margin - 6);
            doc.text(descLines, margin + 3, yPos + 4);

            yPos += descBoxHeight + 8;
    }

    // === OBSERVATIONS AND TECHNICIAN ===
    if (yPos > pageHeight - 40) {
                doc.addPage();
            yPos = margin;
    }

            const obsBoxStartY = yPos;
            const obsBoxHeight = 25;

            // Draw box
            doc.setDrawColor(200, 200, 200);
            doc.rect(margin, obsBoxStartY, pageWidth - 2 * margin, obsBoxHeight);

            // Vertical divider
            doc.line(middleX, obsBoxStartY, middleX, obsBoxStartY + obsBoxHeight);

            // Left side - Technician
            let obsLeftY = obsBoxStartY + 5;
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(40, 40, 40);
            doc.text('TÉCNICO ASIGNADO', margin + 3, obsLeftY);

            obsLeftY += 5;
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(60, 60, 60);
            doc.text(formData.tecnicoAsignado || 'Por asignar', margin + 3, obsLeftY);

            // Right side - Observations
            let obsRightY = obsBoxStartY + 5;
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(40, 40, 40);
            doc.text('OBSERVACIONES', middleX + 3, obsRightY);

            obsRightY += 5;
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(60, 60, 60);
            const obsLines = doc.splitTextToSize(formData.observaciones || 'Ninguna', rightColWidth);
            doc.text(obsLines, middleX + 3, obsRightY);

            yPos = obsBoxStartY + obsBoxHeight + 10;

    // === SIGNATURES SECTION ===
    if (yPos > pageHeight - 35) {
                doc.addPage();
            yPos = margin;
    }

            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(40, 40, 40);
            doc.text('FIRMAS', margin, yPos);
            yPos += 8;

            // Three signature boxes
            const sigBoxWidth = (pageWidth - 2 * margin - 10) / 3;
            const sigBoxHeight = 20;

            // Cliente
            doc.setDrawColor(200, 200, 200);
            doc.rect(margin, yPos, sigBoxWidth, sigBoxHeight);
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(60, 60, 60);
            doc.text('Cliente', margin + sigBoxWidth / 2, yPos + sigBoxHeight - 3, {align: 'center' });

            // Técnico
            doc.rect(margin + sigBoxWidth + 5, yPos, sigBoxWidth, sigBoxHeight);
            doc.text('Técnico', margin + sigBoxWidth + 5 + sigBoxWidth / 2, yPos + sigBoxHeight - 3, {align: 'center' });

            // Supervisor
            doc.rect(margin + 2 * sigBoxWidth + 10, yPos, sigBoxWidth, sigBoxHeight);
            doc.text('Supervisor', margin + 2 * sigBoxWidth + 10 + sigBoxWidth / 2, yPos + sigBoxHeight - 3, {align: 'center' });

            // Company info at bottom
            yPos = pageHeight - 15;
            doc.setFontSize(7);
            doc.setTextColor(100, 100, 100);
            doc.setFont('helvetica', 'normal');
            doc.text('Blvd. Rogelio Cantú Gómez 333-9, Col. Santa María, Monterrey, N.L, 64650', pageWidth / 2, yPos, {align: 'center' });
            doc.text('Tel: 813-557-3724 & 811-418-5412  |  RFC: UPD141011MC3', pageWidth / 2, yPos + 3, {align: 'center' });

            // Save PDF
            const fileName = `Orden_Trabajo_${currentOrderNumber}_${formData.cliente.replace(/\s+/g, '_')}.pdf`;
            doc.save(fileName);

            toast.success('PDF generado exitosamente', {id: loadingToast });
} catch (error) {
                console.error('Error generando PDF:', error);
            toast.error('Error al generar el PDF', {id: loadingToast });
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
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Fecha Programada</label>
                                <input
                                    type="date"
                                    name="fechaProgramada"
                                    value={formData.fechaProgramada}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Fecha Finalización</label>
                                <input
                                    type="date"
                                    name="fechaFinalizacion"
                                    value={formData.fechaFinalizacion}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Teléfono</label>
                                <input
                                    type="text"
                                    name="telefono"
                                    value={formData.telefono}
                                    onChange={handleInputChange}
                                    placeholder="446 133-3079"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Fax</label>
                                <input
                                    type="text"
                                    name="fax"
                                    value={formData.fax}
                                    onChange={handleInputChange}
                                    placeholder="446"
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
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Clave del Cliente</label>
                                <input
                                    type="text"
                                    name="claveCliente"
                                    value={formData.claveCliente}
                                    onChange={handleInputChange}
                                    placeholder="Ej: AMA200131284"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Condiciones</label>
                                <input
                                    type="text"
                                    name="condiciones"
                                    value={formData.condiciones}
                                    onChange={handleInputChange}
                                    placeholder="Ej: 80"
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
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Vía de Embarque</label>
                                <input
                                    type="text"
                                    name="viaEmbarque"
                                    value={formData.viaEmbarque}
                                    onChange={handleInputChange}
                                    placeholder="Método de envío"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Almacén</label>
                                <input
                                    type="text"
                                    name="almacen"
                                    value={formData.almacen}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Sucursal</label>
                                <input
                                    type="text"
                                    name="sucursal"
                                    value={formData.sucursal}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Orden de Compra</label>
                                <input
                                    type="text"
                                    name="ordenCompra"
                                    value={formData.ordenCompra}
                                    onChange={handleInputChange}
                                    placeholder="Número de orden"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Agente 1</label>
                                <input
                                    type="text"
                                    name="agente1"
                                    value={formData.agente1}
                                    onChange={handleInputChange}
                                    placeholder="Nombre del agente"
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
                                                step="0.01"
                                                value={item.cantidad}
                                                onChange={(e) => actualizarItem(item.id, 'cantidad', e.target.value)}
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
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1">Atributos</label>
                                            <input
                                                type="text"
                                                value={item.atributos}
                                                onChange={(e) => actualizarItem(item.id, 'atributos', e.target.value)}
                                                placeholder="Atributos"
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
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1">Fecha Entrega</label>
                                            <input
                                                type="text"
                                                value={item.fechaEntrega}
                                                onChange={(e) => actualizarItem(item.id, 'fechaEntrega', e.target.value)}
                                                placeholder="/ /"
                                                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                                            />
                                        </div>
                                        <div className="md:col-span-6">
                                            <label className="block text-xs font-semibold text-gray-600 mb-1">Descripción</label>
                                            <textarea
                                                value={item.descripcion}
                                                onChange={(e) => actualizarItem(item.id, 'descripcion', e.target.value)}
                                                placeholder="Descripción del producto/servicio"
                                                rows="2"
                                                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 resize-none"
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
