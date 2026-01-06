import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { saveAs } from 'file-saver';

// --- TYPES ---
interface ExportColumn {
    header: string;
    key: string;
    width?: number;
}

// --- EXCEL EXPORT ---
export const exportToExcel = (data: any[], columns: ExportColumn[], fileName: string) => {
    // Map data to headers
    const exportData = data.map(item => {
        const row: any = {};
        columns.forEach(col => {
            // Handle nested properties (e.g., 'item.name')
            const keys = col.key.split('.');
            let value = item;
            for (const k of keys) {
                value = value ? value[k] : '';
            }
            row[col.header] = value;
        });
        return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Inventário");

    // Generate buffer
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const dataBlob = new Blob([excelBuffer], { type: 'application/octet-stream' });

    saveAs(dataBlob, `${fileName}.xlsx`);
};

// --- PDF EXPORT ---
export const exportToPDF = (data: any[], columns: ExportColumn[], title: string, fileName: string) => {
    const doc = new jsPDF();

    // Add Title
    doc.setFontSize(16);
    doc.text(title, 14, 22);
    doc.setFontSize(10);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 14, 30);

    // Prepare table data
    const tableHead = [columns.map(c => c.header)];
    const tableBody = data.map(item => {
        return columns.map(col => {
            const keys = col.key.split('.');
            let value = item;
            for (const k of keys) {
                value = value ? value[k] : '';
            }
            return value;
        });
    });

    // Generate Table
    autoTable(doc, {
        head: tableHead,
        body: tableBody,
        startY: 35,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [41, 128, 185] }, // Brand logic approximation
    });

    doc.save(`${fileName}.pdf`);
};
