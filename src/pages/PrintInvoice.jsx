import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axios';
import InvoicePrint from '../components/InvoicePrint';

/**
 * Dedicated Print Page - Opens in new tab for ESC/POS app capture
 * This page renders ONLY the invoice with no modal/sidebar/header
 * The ESC/POS Bluetooth app will capture this clean page
 */
export default function PrintInvoice() {
    const { invoiceId } = useParams();
    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Force viewport to exact print width - prevents mobile scaling
    useEffect(() => {
        // Set viewport to fixed 640px width (80mm at 203 DPI)
        const viewport = document.querySelector('meta[name="viewport"]');
        const originalContent = viewport?.content;

        if (viewport) {
            viewport.content = 'width=640, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
        }

        // Set body styles to prevent any scaling
        document.body.style.width = '640px';
        document.body.style.maxWidth = '640px';
        document.body.style.margin = '0';
        document.body.style.padding = '0';
        document.body.style.overflow = 'visible';

        // Cleanup on unmount
        return () => {
            if (viewport && originalContent) {
                viewport.content = originalContent;
            }
            document.body.style.width = '';
            document.body.style.maxWidth = '';
            document.body.style.margin = '';
            document.body.style.padding = '';
            document.body.style.overflow = '';
        };
    }, []);

    useEffect(() => {
        const fetchInvoice = async () => {
            try {
                const response = await api.get(`/sales/${invoiceId}`);
                setInvoice(response.data);
            } catch (err) {
                console.error('Failed to fetch invoice:', err);
                setError('Failed to load invoice');
            } finally {
                setLoading(false);
            }
        };

        if (invoiceId) {
            fetchInvoice();
        }
    }, [invoiceId]);

    // Auto-trigger print dialog when invoice loads (like the old PHP system)
    useEffect(() => {
        if (invoice && !loading) {
            // Small delay to ensure rendering is complete
            setTimeout(() => {
                window.print();
            }, 500);
        }
    }, [invoice, loading]);

    if (loading) {
        return (
            <div style={{
                width: '640px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                fontFamily: 'Arial, sans-serif'
            }}>
                Loading invoice...
            </div>
        );
    }

    if (error || !invoice) {
        return (
            <div style={{
                width: '640px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                fontFamily: 'Arial, sans-serif',
                color: 'red'
            }}>
                {error || 'Invoice not found'}
            </div>
        );
    }

    // Parse items for InvoicePrint component
    const items = invoice.InvoiceItems?.map(item => {
        if (item.prescription_data && typeof item.prescription_data === 'string') {
            try {
                return { ...item, prescription_data: JSON.parse(item.prescription_data) };
            } catch (e) {
                return item;
            }
        }
        return item;
    }) || [];

    return (
        <div style={{
            width: '640px',
            backgroundColor: '#fff',
            minHeight: '100vh',
            padding: 0,
            margin: 0
        }}>
            {/* Clean invoice - no modal, no sidebar, just the invoice */}
            <InvoicePrint
                invoice={invoice}
                items={items}
                customer={invoice.Customer}
                user={invoice.User}
            />

            {/* Print-specific styles */}
            <style>
                {`
                    @media print {
                        @page {
                            margin: 0;
                            size: auto;
                        }
                        body {
                            margin: 0;
                            padding: 0;
                        }
                    }
                    
                    /* Hide everything except the invoice when printing */
                    @media print {
                        body * {
                            visibility: hidden;
                        }
                        .print-receipt, .print-receipt * {
                            visibility: visible;
                        }
                        .print-receipt {
                            position: absolute;
                            left: 0;
                            top: 0;
                        }
                    }
                `}
            </style>
        </div>
    );
}
