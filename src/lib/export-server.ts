import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

// Add type support for jspdf-autotable
declare module 'jspdf' {
    interface jsPDF {
        autoTable: (options: any) => jsPDF;
    }
}

interface ExportData {
    title: string;
    columns: { header: string; key: string; width?: number; format?: 'currency' | 'date' | 'number' }[];
    rows: any[];
    filters?: Record<string, any>;
}

function getNestedValue(obj: any, path: string): any {
    return path.split(".").reduce((acc, key) => acc?.[key], obj);
}

export async function generateExcelBuffer(data: ExportData): Promise<Buffer> {
    const { title, columns, rows } = data;

    // Transform rows based on columns and formatting
    const worksheetData = rows.map(row => {
        const obj: any = {};
        columns.forEach(col => {
            let val = getNestedValue(row, col.key);

            // Basic formatting for Excel
            if (col.format === 'currency' && typeof val === 'number') {
                // xlsx handles number formatting via cell properties, but for simple buffer export
                // we can just pass the number and set the column type later if needed
            } else if (col.format === 'date' && val) {
                val = format(new Date(val), 'dd-MM-yyyy');
            }

            obj[col.header] = val;
        });
        return obj;
    });

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, title.substring(0, 31));

    // Auto-width adjustment
    const colWidths = columns.map(col => ({ wch: Math.max(col.header.length, 15) }));
    worksheet['!cols'] = colWidths;

    // Header styling (Bold - note: simple xlsx doesn't support styles in free version easily without xlsx-js-style)
    // For now, we'll stick to standard XLSX which is widely compatible

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    return buffer;
}

export async function generatePdfBuffer(data: ExportData): Promise<Buffer> {
    const { title, columns, rows, filters } = data;

    // In Node.js environment, jsPDF might need a different initialization if it's not browser
    // However, jspdf usually works in node as well. 
    // We specify 'p' (portrait), 'mm' (millimeters), 'a4' (A4 paper)
    const doc = new jsPDF('p', 'mm', 'a4');

    // Title
    doc.setFontSize(18);
    doc.text(title, 14, 22);

    // Sub-header (Date & Filters)
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${format(new Date(), 'dd-MM-yyyy HH:mm')}`, 14, 30);

    if (filters && Object.keys(filters).length > 0) {
        const filterText = Object.entries(filters)
            .map(([k, v]) => `${k}: ${v}`)
            .join(' | ');
        doc.text(`Filters: ${filterText}`, 14, 35);
    }

    const tableHeaders = columns.map(col => col.header);
    const tableRows = rows.map(row =>
        columns.map(col => {
            let val = getNestedValue(row, col.key);

            switch (col.format) {
                case 'currency':
                    if (val == null || val === '') return '';

                    return new Intl.NumberFormat('en-IN', {
                        style: 'currency',
                        currency: 'INR',
                    }).format(Number(val));

                case 'date':
                    return val
                        ? format(new Date(val), 'dd-MM-yyyy')
                        : '';

                case 'number':
                    return val != null
                        ? Number(val).toLocaleString('en-IN')
                        : '';

                default:
                    return val != null ? String(val) : '';
            }
        })
    );

    autoTable(doc, {
        head: [tableHeaders],
        body: tableRows,
        startY: 40,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
        styles: { fontSize: 8, cellPadding: 2 },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { top: 40 },
    });

    const arrayBuffer = doc.output('arraybuffer');
    return Buffer.from(arrayBuffer);
}
