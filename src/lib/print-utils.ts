/**
 * Utility for handling browser printing with dynamic filenames.
 * Changes the document title temporarily to influence the default PDF filename.
 */

export interface PrintOptions {
    type: 'Invoice' | 'Receipt' | 'Annexure' | 'Quotation' | 'VendorPayment' | 'Ledger' | 'Booking' | 'Installation' | 'Inspection';
    clientName?: string;
    invoiceNo?: string;
    receiptNo?: string;
    quotationNo?: string;
    bookingNo?: string;
    hoardingCode?: string;
    vendorCode?: string;
    date?: string | Date;
    clientCode?: string;
}

/**
 * Sanitizes a string to be used as a filename.
 */
export function sanitizeFilename(name: string): string {
    return name
        .replace(/[/\\?%*:|"<>]/g, '-') // Replace invalid chars
        .replace(/\s+/g, '-')           // Replace spaces with hyphens
        .replace(/-+/g, '-')            // Avoid duplicate hyphens
        .replace(/^-+|-+$/g, '');       // Trim hyphens
}

/**
 * Generates a formatted filename based on the document type and data.
 */
export function generatePrintTitle(options: PrintOptions): string {
    const { type, clientName, invoiceNo, receiptNo, quotationNo, bookingNo, hoardingCode, vendorCode, date, clientCode } = options;
    
    let parts: string[] = [type];

    switch (type) {
        case 'Invoice':
            if (invoiceNo) parts.push(invoiceNo);
            if (clientName) parts.push(clientName);
            break;
        case 'Receipt':
            if (receiptNo) parts.push(receiptNo);
            if (clientName) parts.push(clientName);
            break;
        case 'Annexure':
            if (clientName) parts.push(clientName);
            if (hoardingCode) parts.push(hoardingCode);
            break;
        case 'Quotation':
            if (quotationNo) parts.push(quotationNo);
            if (clientName) parts.push(clientName);
            break;
        case 'VendorPayment':
            if (vendorCode) parts.push(vendorCode);
            break;
        case 'Ledger':
            if (clientCode) parts.push(clientCode);
            else if (clientName) parts.push(clientName);
            break;
        case 'Booking':
            if (bookingNo) parts.push(bookingNo);
            break;
        case 'Installation':
            if (hoardingCode) parts.push(hoardingCode);
            break;
        case 'Inspection':
            if (hoardingCode) parts.push(hoardingCode);
            if (date) {
                const d = typeof date === 'string' ? new Date(date) : date;
                parts.push(d.toISOString().split('T')[0]);
            }
            break;
    }

    return parts.map(p => sanitizeFilename(p)).join('-');
}

/**
 * Triggers the browser print dialog with a dynamic title.
 * Restores the original title after the dialog is closed.
 */
export function triggerPrint(options: PrintOptions | string): void {
    const originalTitle = document.title;
    const printTitle = typeof options === 'string' ? sanitizeFilename(options) : generatePrintTitle(options);

    document.title = printTitle;
    
    // Use a small timeout to ensure some browsers catch the title change
    setTimeout(() => {
        window.print();
        
        // Restore title after a delay to ensure print process has captured it
        // Some browsers capture on window.print(), others might wait until dialog starts
        setTimeout(() => {
            document.title = originalTitle;
        }, 500);
    }, 50);
}
