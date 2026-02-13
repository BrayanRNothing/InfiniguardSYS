import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import logoImg from '../assets/LOGOUPDM.png';

/**
 * Genera el PDF de la cotización
 * @param {Object} formData Datos del formulario/cotización
 * @param {Array} items Lista de productos/servicios
 * @param {String} quotationNumber Número de cotización (e.g. COT-000123)
 * @returns {Promise<File>} Archivo PDF generado
 */
export async function generarPDFCotizacion(formData, items, quotationNumber) {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    let yPos = 10;

    // --- HELPER FUNCTIONS ---
    const formatCurrency = (value) => {
        const currencyCode = formData.moneda || 'MXN';
        const formatted = new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: currencyCode
        }).format(value);
        return currencyCode === 'MXN' ? `${formatted} MXN` : formatted;
    };

    const calcularSubtotal = (item) => (parseFloat(item.cantidad) || 0) * (parseFloat(item.precioUnitario) || 0);
    const calcularTotalItems = () => items.reduce((sum, item) => sum + calcularSubtotal(item), 0);
    const calcularDescuento = () => calcularTotalItems() * (parseFloat(formData.descuento) || 0) / 100;
    const calcularImpuesto = () => (calcularTotalItems() - calcularDescuento()) * (parseFloat(formData.impuesto) || 0) / 100;
    const calcularTotal = () => calcularTotalItems() - calcularDescuento() + calcularImpuesto();

    try {
        // Logo
        const logoWidth = 50;
        const logoHeight = 20;
        doc.addImage(logoImg, 'PNG', 14, yPos, logoWidth, logoHeight);

        // Header Text
        doc.setFontSize(22);
        doc.setTextColor(33, 33, 33);
        doc.setFont('helvetica', 'bold');
        doc.text('COTIZACIÓN', pageWidth - 14, yPos + 10, { align: 'right' });

        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.setFont('helvetica', 'normal');
        doc.text(quotationNumber, pageWidth - 14, yPos + 16, { align: 'right' });

        doc.setFontSize(9);
        doc.text(`Fecha: ${formData.fecha}`, pageWidth - 14, yPos + 22, { align: 'right' });
        doc.text(`Validez: ${formData.validez} días`, pageWidth - 14, yPos + 27, { align: 'right' });

        yPos += 35;

        // Title
        doc.setFontSize(14);
        doc.setTextColor(0, 51, 153); // Blue
        doc.setFont('helvetica', 'bold');
        doc.text(formData.titulo.toUpperCase(), 14, yPos);
        yPos += 10;

        // Client & Info Box
        const boxStartY = yPos;
        let boxContentHeight = 25; // Base height

        // Calculate box height dynamically
        if (formData.clienteEmpresa) boxContentHeight += 5;
        if (formData.clienteEmail) boxContentHeight += 5;
        if (formData.clienteTelefono) boxContentHeight += 5;
        if (formData.clienteDireccion) {
            const direccionLines = doc.splitTextToSize(formData.clienteDireccion, pageWidth - 60);
            boxContentHeight += 5 + (direccionLines.length - 1) * 4;
        }

        boxContentHeight += 4; // Padding

        // Draw box
        doc.setDrawColor(200, 200, 200);
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(14, boxStartY, pageWidth - 28, boxContentHeight, 2, 2, 'FD');

        yPos += 6;
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
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

        // Table
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

        // Total Line
        doc.setDrawColor(100, 100, 100);
        doc.setLineWidth(0.5);
        doc.line(totalsLabelX - 5, yPos - 4, totalsX, yPos - 4);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(60, 60, 60);
        doc.text('TOTAL:', totalsLabelX, yPos);
        doc.text(formatCurrency(calcularTotal()), totalsX, yPos, { align: 'right' });
        yPos += 15;

        // Notes & Terms logic
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

        // Notes
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

        // Terms
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

        // Return File
        const fileName = `${quotationNumber}_${formData.clienteNombre.replace(/\s+/g, '_')}.pdf`;
        const pdfBlob = doc.output('blob');
        return new File([pdfBlob], fileName, { type: 'application/pdf' });

    } catch (error) {
        console.error('Error generando PDF:', error);
        throw error;
    }
}
