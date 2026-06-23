import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import logoImg from '../assets/LOGOUPDM.png';
import { generarPDFCotizacion } from './pdfGenerator';

export async function regenerarPDF(doc) {
    const numeroUpper = (doc.numero || '').toUpperCase();
    
    if (numeroUpper.startsWith('COT-')) {
        // Mapear doc a formData para cotización
        const formData = {
            fecha: doc.fecha || '',
            validez: doc.datos?.validez || doc.validez || '30',
            titulo: doc.titulo || '',
            moneda: doc.datos?.moneda || doc.moneda || 'MXN',
            descuento: doc.datos?.descuento || doc.descuento || '0',
            impuesto: doc.datos?.impuesto || doc.impuesto || '16',
            descripcion: doc.datos?.descripcion || doc.descripcion || '',
            notas: doc.datos?.notas || doc.notas || '',
            terminosCondiciones: doc.tos || doc.datos?.terminosCondiciones || doc.terminosCondiciones || '',
            clienteNombre: doc.cliente?.nombre || doc.clienteNombre || '',
            clienteEmpresa: doc.cliente?.empresa || doc.clienteEmpresa || '',
            clienteEmail: doc.cliente?.email || doc.clienteEmail || '',
            clienteTelefono: doc.cliente?.telefono || doc.clienteTelefono || '',
            clienteDireccion: doc.cliente?.direccion || doc.clienteDireccion || '',
            creadoPor: doc.datos?.creadoPor || doc.creadoPor || 'Admin'
        };
        const items = doc.productos || doc.items || [];
        return await generarPDFCotizacion(formData, items, doc.numero);
    } else if (numeroUpper.startsWith('OT-')) {
        return generarPDFOrdenTrabajo(doc);
    } else if (numeroUpper.startsWith('RT-')) {
        return generarPDFReporteTrabajo(doc);
    } else {
        // Fallback a cotización
        const items = doc.productos || doc.items || [];
        return await generarPDFCotizacion(doc, items, doc.numero);
    }
}

function generarPDFOrdenTrabajo(doc) {
    const formData = {
        ot: doc.numero || '',
        fecha: doc.fecha || '',
        nombre: doc.cliente?.nombre || '',
        ubicacion: doc.cliente?.ubicacion || doc.cliente?.direccion || '',
        telefono: doc.cliente?.telefono || '',
        correo: doc.cliente?.correo || doc.cliente?.email || '',
        tecnico: doc.tecnico || '',
        ayudante: doc.ayudante || '',
        notas: doc.notas || ''
    };
    const equipos = doc.equipos || [];

    const pdfDoc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const W = pdfDoc.internal.pageSize.width;
    const H = pdfDoc.internal.pageSize.height;
    const M = 10;
    const GREEN = [100, 180, 50];

    autoTable(pdfDoc, {
        startY: M,
        theme: 'plain',
        body: [
            [
                { content: '', styles: { minCellHeight: 25, valign: 'middle', halign: 'center' } },
                { content: 'MANTENIMIENTO\nPREVENTIVO', styles: { fontSize: 24, fontStyle: 'bold', halign: 'center', valign: 'middle', textColor: 20 } }
            ]
        ],
        columnStyles: {
            0: { cellWidth: 50 },
            1: { cellWidth: 'auto' }
        },
        styles: { lineColor: [40, 40, 40], lineWidth: 0.2 },
        didDrawCell: (data) => {
            if (data.section === 'body' && data.column.index === 0 && data.row.index === 0) {
                try {
                    const img = new Image();
                    img.src = logoImg;
                    pdfDoc.addImage(img, 'PNG', data.cell.x + 5, data.cell.y + 2, 40, 21);
                } catch (e) { console.warn(e); }
            }
        },
        margin: { left: M, right: M }
    });

    const [year, month, day] = (formData.fecha || '').split('-');
    const fechaFmt = formData.fecha ? `${day} / ${month} / ${year}` : '—';

    autoTable(pdfDoc, {
        startY: pdfDoc.lastAutoTable.finalY,
        theme: 'grid',
        head: [],
        body: [
            [{ content: 'DATOS DEL CLIENTE', colSpan: 2, styles: { fillColor: GREEN, textColor: 255, fontStyle: 'bold', halign: 'center', cellPadding: 1.5 } }],
            [`NOMBRE: ${formData.nombre}`, `UBICACIÓN: ${formData.ubicacion}`],
            [`TELEFONO: ${formData.telefono}`, `CORREO: ${formData.correo}`],
            [{ content: 'DATOS DEL EQUIPO', colSpan: 2, styles: { fillColor: GREEN, textColor: 255, fontStyle: 'bold', halign: 'center', cellPadding: 1.5 } }],
            [`TECNICO: ${formData.tecnico}`, `AYUDANTE: ${formData.ayudante || 'N/A'}`],
            [`FECHA: ${fechaFmt}`, `OT: ${formData.ot}`]
        ],
        styles: { lineColor: [40, 40, 40], lineWidth: 0.2, fontSize: 9, cellPadding: 2, textColor: [20, 20, 20] },
        columnStyles: { 0: { cellWidth: (W - 2 * M) / 2 }, 1: { cellWidth: (W - 2 * M) / 2 } },
        margin: { left: M, right: M }
    });

    const tableBody = equipos.map((e, i) => [
        i + 1,
        e.marca || '',
        e.modelo || '',
        e.qr || '',
        e.descripcion || ''
    ]);

    autoTable(pdfDoc, {
        startY: pdfDoc.lastAutoTable.finalY + 5,
        head: [['No.', 'Marca', 'Modelo', 'QR', 'Descripción del trabajo']],
        body: tableBody,
        theme: 'grid',
        margin: { left: M, right: M },
        tableWidth: W - 2 * M,
        styles: { fontSize: 8, cellPadding: 3, lineColor: [40, 40, 40], lineWidth: 0.2, textColor: [0, 0, 0] },
        headStyles: { fillColor: GREEN, textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center', fontSize: 9, lineColor: [40, 40, 40], lineWidth: 0.2 },
        columnStyles: { 0: { halign: 'center', cellWidth: 12 }, 1: { cellWidth: 28 }, 2: { cellWidth: 42 }, 3: { cellWidth: 28 }, 4: { cellWidth: 'auto' } },
        alternateRowStyles: { fillColor: [245, 253, 240] }
    });

    let y = pdfDoc.lastAutoTable.finalY + 10;

    pdfDoc.setFont('helvetica', 'normal');
    pdfDoc.setFontSize(10);
    pdfDoc.setTextColor(0, 0, 0);
    pdfDoc.text('NOTAS y OBSERVACIONES:', M, y);
    y += 5;

    if (formData.notas) {
        pdfDoc.setFontSize(9);
        const notaLines = pdfDoc.splitTextToSize(formData.notas, W - 2 * M);
        pdfDoc.text(notaLines, M, y);
        y += notaLines.length * 5 + 10;
    } else {
        y += 20;
    }

    if (y > H - 35) {
        pdfDoc.addPage();
        y = 40;
    } else {
        if (H - y > 60) y = H - 40;
        else y += 10;
    }

    const sigW = 50;
    const sigGap = (W - 2 * M - 3 * sigW) / 2;
    const x1 = M;
    const x2 = M + sigW + sigGap;
    const x3 = M + 2 * sigW + 2 * sigGap;

    pdfDoc.setDrawColor(0);
    pdfDoc.setLineWidth(0.5);
    pdfDoc.line(x1, y, x1 + sigW, y);
    pdfDoc.line(x2, y, x2 + sigW, y);
    pdfDoc.line(x3, y, x3 + sigW, y);

    pdfDoc.setFontSize(9);
    pdfDoc.setTextColor(0, 0, 0);
    pdfDoc.text('Firma del técnico', x1 + sigW / 2, y + 5, { align: 'center' });
    pdfDoc.text('Firma cliente', x2 + sigW / 2, y + 5, { align: 'center' });
    pdfDoc.text('Firma supervisor', x3 + sigW / 2, y + 5, { align: 'center' });

    const pdfBlob = pdfDoc.output('blob');
    return new File([pdfBlob], `${formData.ot}.pdf`, { type: 'application/pdf' });
}

function generarPDFReporteTrabajo(docObj) {
    const formData = {
        ordenNumero: docObj.numero || '',
        fecha: docObj.fecha || '',
        cliente: docObj.cliente?.nombre || '',
        direccion: docObj.cliente?.direccion || docObj.cliente?.ubicacion || '',
        contacto: docObj.cliente?.contacto || '',
        vendedor: docObj.vendedor || '',
        estado: docObj.estado || '',
        observaciones: docObj.observaciones || ''
    };
    const items = docObj.items || [];

    const checklistPreguntas = [
        '¿Área de trabajo adecuada y ventilada?', '¿Equipo o unidad ya instalada?', '¿Equipo en azotea con acceso disponible?',
        '¿Área cuenta con energía eléctrica disponible?', '¿Área cuenta con suministro de agua disponible?', '¿Área cuenta con drenaje o desagüe adecuado?',
        '¿Se llenó reporte de Inspección en Recibo?', '¿Se necesitaron maniobras de carga y descarga?', '¿Se desempacó y empacó la unidad o máquina?',
        '¿Se desensambló y ensambló el equipo?', '¿Se aislaron componentes eléctricos?', '¿Se aplicó Infiniguard Prep para limpieza?',
        '¿Se hizo lavado con agua a presión?', '¿Se completó el secado del equipo?', '¿Se aplicó Infiniguard de acuerdo a guía?',
        '¿Condiciones de temperatura adecuadas?', '¿Condiciones de humedad adecuadas?', '¿Se etiquetó correctamente el equipo?',
        '¿Se dio de alta garantía y código QR?', '¿Se llenó reporte de Inspección de Envío?'
    ];

    const pdfDoc = new jsPDF();
    const pageWidth = pdfDoc.internal.pageSize.width;
    const pageHeight = pdfDoc.internal.pageSize.height;
    const margin = 15;
    let yPos = margin;

    const logoWidth = 25;
    const logoHeight = 12;
    const img = new Image();
    img.src = logoImg;
    try { pdfDoc.addImage(img, 'PNG', margin, yPos, logoWidth, logoHeight); } catch (e) { }

    pdfDoc.setTextColor(60, 60, 60);
    pdfDoc.setFontSize(14);
    pdfDoc.setFont('helvetica', 'bold');
    pdfDoc.text('REPORTE DE TRABAJO', pageWidth - margin, yPos + 6, { align: 'right' });

    yPos += 16;
    pdfDoc.setFontSize(8);
    pdfDoc.setFont('helvetica', 'bold');
    pdfDoc.text(`Orden: ${formData.ordenNumero}`, margin, yPos);
    pdfDoc.text(formData.fecha, pageWidth - margin, yPos, { align: 'right' });
    yPos += 6;

    pdfDoc.setDrawColor(180, 180, 180);
    pdfDoc.setLineWidth(0.3);
    pdfDoc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 5;

    pdfDoc.setFontSize(6);
    pdfDoc.setFont('helvetica', 'bold');
    pdfDoc.text('Cliente:', margin, yPos);
    pdfDoc.setFont('helvetica', 'normal');
    pdfDoc.text(formData.cliente || ' ', margin + 13, yPos);
    pdfDoc.setFont('helvetica', 'bold');
    pdfDoc.text('Estado:', margin + 100, yPos);
    pdfDoc.setFont('helvetica', 'normal');
    pdfDoc.text(formData.estado || ' ', margin + 113, yPos);
    yPos += 3.5;

    pdfDoc.setFont('helvetica', 'bold');
    pdfDoc.text('Contacto:', margin, yPos);
    pdfDoc.setFont('helvetica', 'normal');
    pdfDoc.text(formData.contacto || 'N/A', margin + 13, yPos);
    yPos += 3.5;

    pdfDoc.setFont('helvetica', 'bold');
    pdfDoc.text('Vendedor:', margin, yPos);
    pdfDoc.setFont('helvetica', 'normal');
    pdfDoc.text(formData.vendedor || 'N/A', margin + 15, yPos);
    yPos += 3.5;

    pdfDoc.setFont('helvetica', 'bold');
    pdfDoc.text('Dirección:', margin, yPos);
    yPos += 2.5;
    pdfDoc.setFont('helvetica', 'normal');
    if (formData.direccion) {
        const dirLines = pdfDoc.splitTextToSize(formData.direccion, pageWidth - 2 * margin);
        pdfDoc.text(dirLines, margin, yPos);
        yPos += dirLines.length * 3;
    }
    yPos += 4;

    pdfDoc.setFontSize(8);
    pdfDoc.setFont('helvetica', 'bold');
    pdfDoc.text('PRODUCTOS / SERVICIOS', margin, yPos);
    yPos += 4;

    pdfDoc.setFillColor(220, 220, 220);
    pdfDoc.rect(margin, yPos, pageWidth - 2 * margin, 5, 'F');
    pdfDoc.setFontSize(6);
    pdfDoc.text('Part.', margin + 2, yPos + 3.5);
    pdfDoc.text('Cant.', margin + 12, yPos + 3.5);
    pdfDoc.text('Clave', margin + 25, yPos + 3.5);
    pdfDoc.text('Descripción', margin + 55, yPos + 3.5);
    pdfDoc.text('Unidad', pageWidth - margin - 15, yPos + 3.5);
    yPos += 6;

    pdfDoc.setFont('helvetica', 'normal');
    pdfDoc.setFontSize(6);

    items.forEach((item, index) => {
        if (yPos > pageHeight - 120) {
            pdfDoc.addPage();
            yPos = margin;
        }
        pdfDoc.text((item.partida || index+1).toString(), margin + 2, yPos);
        pdfDoc.text((item.cantidad || 1).toString(), margin + 12, yPos);
        pdfDoc.text((item.clave || '').substring(0, 20), margin + 25, yPos);
        const descLines = pdfDoc.splitTextToSize(item.descripcion || '', 100);
        pdfDoc.text(descLines, margin + 55, yPos);
        pdfDoc.text((item.unidad || '').substring(0, 8), pageWidth - margin - 15, yPos);
        yPos += Math.max(4, descLines.length * 3);
    });

    yPos += 4;
    pdfDoc.setFontSize(7);
    pdfDoc.setFont('helvetica', 'bold');
    pdfDoc.text('Observaciones:', margin, yPos);
    yPos += 3;
    pdfDoc.setFont('helvetica', 'normal');
    pdfDoc.setFontSize(6);
    if (formData.observaciones) {
        const obsLines = pdfDoc.splitTextToSize(formData.observaciones, pageWidth - 2 * margin);
        pdfDoc.text(obsLines, margin, yPos);
        yPos += obsLines.length * 3;
    } else {
        pdfDoc.text('_________________________________________________________________', margin, yPos);
        yPos += 3;
    }
    yPos += 4;

    pdfDoc.setFontSize(8);
    pdfDoc.setFont('helvetica', 'bold');
    pdfDoc.text('2. REPORTE FINAL (Llenado por operaciones)', margin, yPos);
    yPos += 4;

    pdfDoc.setFillColor(220, 220, 220);
    pdfDoc.rect(margin, yPos, pageWidth - 2 * margin, 5, 'F');
    pdfDoc.setFontSize(6);
    pdfDoc.text('Partida', margin + 2, yPos + 3.5);
    pdfDoc.text('Modelo', margin + 20, yPos + 3.5);
    pdfDoc.text('Cant.', margin + 50, yPos + 3.5);
    pdfDoc.text('Marca', margin + 65, yPos + 3.5);
    pdfDoc.text('Serie', margin + 90, yPos + 3.5);
    pdfDoc.text('Folio QR', margin + 120, yPos + 3.5);
    yPos += 6;

    for (let i = 0; i < 3; i++) {
        pdfDoc.setDrawColor(200, 200, 200);
        pdfDoc.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 5;
    }
    yPos += 4;

    if (yPos > pageHeight - 100) {
        pdfDoc.addPage();
        yPos = margin;
    }

    pdfDoc.setFontSize(8);
    pdfDoc.setFont('helvetica', 'bold');
    pdfDoc.setTextColor(40, 40, 40);
    pdfDoc.text('VERIFICACIÓN DE CHECK LIST', margin, yPos);
    yPos += 4;

    const col1X = margin;
    const col2X = pageWidth / 2 + 1;
    const colWidth = (pageWidth / 2) - margin - 3;
    let col1Y = yPos, col2Y = yPos;

    pdfDoc.setFontSize(6);
    pdfDoc.setFont('helvetica', 'normal');
    pdfDoc.setTextColor(60, 60, 60);

    checklistPreguntas.forEach((pregunta, index) => {
        const isLeftColumn = index < 10;
        const currentX = isLeftColumn ? col1X : col2X;
        let currentY = isLeftColumn ? col1Y : col2Y;

        if (currentY > pageHeight - 25) {
            pdfDoc.addPage();
            col1Y = margin;
            col2Y = margin;
            currentY = margin;
        }
        pdfDoc.setDrawColor(100, 100, 100);
        pdfDoc.setLineWidth(0.2);
        pdfDoc.rect(currentX, currentY - 2, 2.5, 2.5);
        pdfDoc.text(`${index + 1}.`, currentX + 3, currentY);

        const preguntaLines = pdfDoc.splitTextToSize(pregunta, colWidth - 25);
        pdfDoc.text(preguntaLines, currentX + 6, currentY);
        currentY += Math.max(3, preguntaLines.length * 2.5);

        pdfDoc.text('SI', currentX + 6, currentY);
        pdfDoc.rect(currentX + 10, currentY - 2, 2.5, 2.5);
        pdfDoc.text('NO', currentX + 14, currentY);
        pdfDoc.rect(currentX + 19, currentY - 2, 2.5, 2.5);
        currentY += 3.5;

        if (isLeftColumn) col1Y = currentY;
        else col2Y = currentY;
    });

    yPos = Math.max(col1Y, col2Y) + 4;

    pdfDoc.setFontSize(7);
    pdfDoc.setFont('helvetica', 'bold');
    pdfDoc.text('FIRMAS', margin, yPos);
    yPos += 5;
    const sigWidth = (pageWidth - 2 * margin - 10) / 3;
    pdfDoc.setFontSize(6);
    pdfDoc.setFont('helvetica', 'normal');

    pdfDoc.text('Nombre y firma Cliente', margin, yPos);
    pdfDoc.line(margin, yPos + 8, margin + sigWidth, yPos + 8);
    pdfDoc.text('Nombre y firma Aplicador', margin + sigWidth + 5, yPos);
    pdfDoc.line(margin + sigWidth + 5, yPos + 8, margin + 2 * sigWidth + 5, yPos + 8);
    pdfDoc.text('Fecha de entrega', margin + 2 * sigWidth + 10, yPos);
    pdfDoc.line(margin + 2 * sigWidth + 10, yPos + 8, pageWidth - margin, yPos + 8);

    yPos += 12;
    pdfDoc.setFontSize(7);
    pdfDoc.setFont('helvetica', 'bold');
    pdfDoc.setTextColor(40, 40, 40);
    pdfDoc.text('DETALLES FINALES', margin, yPos);
    yPos += 4;

    const detailCol1X = margin;
    const detailCol2X = pageWidth / 2 + 2;
    let detailY = yPos;
    pdfDoc.setFontSize(6);
    pdfDoc.setFont('helvetica', 'normal');
    pdfDoc.setTextColor(60, 60, 60);

    pdfDoc.setFont('helvetica', 'bold');
    pdfDoc.text('Fecha:', detailCol1X, detailY);
    pdfDoc.setFont('helvetica', 'normal');
    pdfDoc.line(detailCol1X + 12, detailY, detailCol1X + 80, detailY);
    detailY += 4;
    pdfDoc.setFont('helvetica', 'bold');
    pdfDoc.text('Cliente:', detailCol1X, detailY);
    pdfDoc.setFont('helvetica', 'normal');
    pdfDoc.line(detailCol1X + 12, detailY, detailCol1X + 80, detailY);
    detailY += 4;
    pdfDoc.setFont('helvetica', 'bold');
    pdfDoc.text('Aplicador:', detailCol1X, detailY);
    pdfDoc.setFont('helvetica', 'normal');
    pdfDoc.line(detailCol1X + 15, detailY, detailCol1X + 80, detailY);
    detailY += 4;

    detailY = yPos;
    pdfDoc.setFont('helvetica', 'bold');
    pdfDoc.text('Ayudantes:', detailCol2X, detailY);
    pdfDoc.setFont('helvetica', 'normal');
    pdfDoc.line(detailCol2X + 18, detailY, pageWidth - margin, detailY);
    detailY += 4;
    pdfDoc.setFont('helvetica', 'bold');
    pdfDoc.text('Horas trabajadas:', detailCol2X, detailY);
    pdfDoc.setFont('helvetica', 'normal');
    pdfDoc.line(detailCol2X + 26, detailY, pageWidth - margin, detailY);
    detailY += 4;
    pdfDoc.setFont('helvetica', 'bold');
    pdfDoc.text('Consumo total:', detailCol2X, detailY);
    pdfDoc.setFont('helvetica', 'normal');
    pdfDoc.line(detailCol2X + 22, detailY, pageWidth - margin, detailY);
    detailY += 4;

    yPos = Math.max(detailY, yPos + 12) + 2;
    pdfDoc.setFont('helvetica', 'bold');
    pdfDoc.text('Observaciones:', margin, yPos);
    yPos += 3;
    pdfDoc.setFont('helvetica', 'normal');
    for (let i = 0; i < 2; i++) {
        pdfDoc.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 3.5;
    }

    yPos = pageHeight - 10;
    pdfDoc.setFontSize(6);
    pdfDoc.setTextColor(120, 120, 120);
    pdfDoc.text('UPDM - Blvd. Rogelio Cantú Gómez 333-9, Monterrey, N.L | Tel: 813-557-3724 & 811-418-5412', pageWidth / 2, yPos, { align: 'center' });

    const pdfBlob = pdfDoc.output('blob');
    return new File([pdfBlob], `${formData.ordenNumero}.pdf`, { type: 'application/pdf' });
}
