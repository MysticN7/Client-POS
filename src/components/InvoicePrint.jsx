import { useRef, forwardRef, useEffect, useState } from 'react';
import { formatDate } from '../utils/dateUtils';
import api from '../api/axios';

const DEFAULT_TEXT_STYLES = {
    business_name: { font_family: 'system-ui, -apple-system, Segoe UI, Arial, sans-serif', font_size: 24, align: 'center', font_weight: 'black' },
    address: { font_family: 'system-ui, -apple-system, Segoe UI, Arial, sans-serif', font_size: 11, align: 'center', font_weight: '800' },
    phone: { font_family: 'system-ui, -apple-system, Segoe UI, Arial, sans-serif', font_size: 11, align: 'center', font_weight: '700' },
    email: { font_family: 'system-ui, -apple-system, Segoe UI, Arial, sans-serif', font_size: 10, align: 'center', font_weight: '500' },
    website: { font_family: 'system-ui, -apple-system, Segoe UI, Arial, sans-serif', font_size: 10, align: 'center', font_weight: '500' },
    invoice_banner: { font_family: 'system-ui, -apple-system, Segoe UI, Arial, sans-serif', font_size: 12, align: 'center', font_weight: '900' },
    customer_section: { font_family: 'system-ui, -apple-system, Segoe UI, Arial, sans-serif', font_size: 12, align: 'left', font_weight: '700' },
    bill_header: { font_family: 'system-ui, -apple-system, Segoe UI, Arial, sans-serif', font_size: 12, align: 'center', font_weight: '900' },
    table_header: { font_family: 'system-ui, -apple-system, Segoe UI, Arial, sans-serif', font_size: 11, align: 'left', font_weight: '900' },
    table_body: { font_family: 'system-ui, -apple-system, Segoe UI, Arial, sans-serif', font_size: 11, align: 'left', font_weight: '500' },
    totals_labels: { font_family: 'system-ui, -apple-system, Segoe UI, Arial, sans-serif', font_size: 11, align: 'right', font_weight: '900' },
    totals_values: { font_family: 'system-ui, -apple-system, Segoe UI, Arial, sans-serif', font_size: 11, align: 'right', font_weight: '900' },
    in_words: { font_family: 'system-ui, -apple-system, Segoe UI, Arial, sans-serif', font_size: 10, align: 'left', font_weight: '700' },
    note_label: { font_family: 'system-ui, -apple-system, Segoe UI, Arial, sans-serif', font_size: 11, align: 'left', font_weight: '700' },
    note_text: { font_family: 'system-ui, -apple-system, Segoe UI, Arial, sans-serif', font_size: 11, align: 'left', font_weight: '500' },
    farewell_text_style: { font_family: 'system-ui, -apple-system, Segoe UI, Arial, sans-serif', font_size: 12, align: 'center', font_weight: '900' },
    footer_text_style: { font_family: 'system-ui, -apple-system, Segoe UI, Arial, sans-serif', font_size: 10, align: 'center', font_weight: '500' },
    signature_customer_label: { font_family: 'system-ui, -apple-system, Segoe UI, Arial, sans-serif', font_size: 10, align: 'center', font_weight: '500' },
    signature_authorized_label: { font_family: 'system-ui, -apple-system, Segoe UI, Arial, sans-serif', font_size: 10, align: 'center', font_weight: '500' },
    rx_header: { font_family: 'system-ui, -apple-system, Segoe UI, Arial, sans-serif', font_size: 12, align: 'center', font_weight: '800' },
    rx_value: { font_family: 'Arial, Helvetica, sans-serif', font_size: 16, align: 'center', font_weight: '800' },
};

const InvoicePrint = forwardRef(({ invoice, customer, items, user, settingsOverride }, ref) => {
    const [settings, setSettings] = useState({
        business_name: 'Minar Optics',
        address: 'Dhaka, Bangladesh',
        phone: '+880 1234 567890',
        email: 'info@minaroptics.com',
        website: '',
        map_link: '',
        footer_text: 'Thank you for your business!',
        show_served_by: true,
        show_date_time: true,
        header_font_size: 12,
        body_font_size: 10,
        show_note: true,
        show_signature: false,
        text_styles: DEFAULT_TEXT_STYLES
    });

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                if (settingsOverride) {
                    setSettings(prev => ({ ...prev, ...settingsOverride, text_styles: { ...prev.text_styles, ...(settingsOverride.text_styles || {}) } }));
                    return;
                }
                const res = await api.get('/invoice-settings');
                if (res.data) {
                    setSettings(prev => ({ ...prev, ...res.data, text_styles: { ...prev.text_styles, ...(res.data.text_styles || {}) } }));
                }
            } catch (err) {
                console.error('Could not load invoice settings, using defaults:', err);
            }
        };
        fetchSettings();
    }, [settingsOverride]);

    // Parse prescription_data if it's a JSON string
    const parsedItems = items?.map(item => {
        if (item.prescription_data && typeof item.prescription_data === 'string') {
            try {
                return { ...item, prescription_data: JSON.parse(item.prescription_data) };
            } catch (e) {
                console.error('Failed to parse prescription_data:', e);
                return item;
            }
        }
        return item;
    }) || [];

    if (!invoice) return <div ref={ref} style={{ padding: '20px' }}>Loading invoice...</div>;

    const numberToWords = (num) => {
        const a = ['', 'one ', 'two ', 'three ', 'four ', 'five ', 'six ', 'seven ', 'eight ', 'nine ', 'ten ', 'eleven ', 'twelve ', 'thirteen ', 'fourteen ', 'fifteen ', 'sixteen ', 'seventeen ', 'eighteen ', 'nineteen '];
        const b = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

        if ((num = num.toString()).length > 9) return 'overflow';
        let n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
        if (!n) return;
        let str = '';
        str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'crore ' : '';
        str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'lakh ' : '';
        str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'thousand ' : '';
        str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'hundred ' : '';
        str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
        return str.trim();
    };

    const netTotal = Math.max(0, invoice.total_amount - invoice.discount);
    const amountInWords = numberToWords(Math.floor(netTotal)) || 'Zero';

    const accent = settings.accent_color || '#1f2937';
    const paperWidth = Number(settings.paper_width_mm) || 80;
    const paperMargin = Number(settings.paper_margin_mm) || 2;
    const gridThickness = Number(settings.grid_thickness_px || 2);
    const PhoneIcon = (props) => (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.08 4.18 2 2 0 0 1 4 2h3a2 2 0 0 1 2 1.72 12.42 12.42 0 0 0 .7 2.8 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.28-1.16a2 2 0 0 1 2.11-.45 12.42 12.42 0 0 0 2.8.7A2 2 0 0 1 22 16.92z" /></svg>
    );
    const MapPinIcon = (props) => (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
    );
    const MailIcon = (props) => (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M4 4h16v16H4z" /><path d="M22 6l-10 7L2 6" /></svg>
    );

    const styleFor = (key) => {
        const s = settings.text_styles?.[key] || {};
        const weightMap = { normal: 400, bold: 700, black: 900 };
        const fw = s.font_weight && weightMap[s.font_weight] ? weightMap[s.font_weight] : (s.font_weight && Number.isFinite(Number(s.font_weight)) ? Number(s.font_weight) : undefined);
        return {
            fontFamily: s.font_family || undefined,
            fontSize: s.font_size ? `${s.font_size}px` : undefined,
            textAlign: s.align || undefined,
            fontWeight: fw,
        };
    };

    return (
        <div ref={ref} className="print-receipt bg-white text-black" style={{ width: `${paperWidth}mm`, margin: '0 auto', fontFamily: 'Arial, sans-serif', fontSize: `${settings.body_font_size || 11}px`, padding: `${paperMargin}mm` }}>
            {/* Header */}
            <div className={`${settings.compact_mode ? 'mb-2' : 'mb-3'}`} style={{ textAlign: settings.logo_position || 'center' }}>
                {settings.show_logo && settings.logo_url && (
                    <div className="mb-1">
                        <img src={settings.logo_url} alt="Logo" style={{ height: `${settings.logo_size_px || 24}px`, display: 'inline-block' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                    </div>
                )}
                <h1 className="uppercase tracking-wide mb-1" style={{ ...styleFor('business_name'), color: accent }}>{settings.business_name}</h1>
                <div className="text-xs" style={styleFor('address')}>
                    {settings.show_icons && <MapPinIcon style={{ display: 'inline', marginRight: 4, color: accent }} />}{settings.address}
                </div>
                <div className="text-xs" style={styleFor('phone')}>
                    {settings.show_icons && <PhoneIcon style={{ display: 'inline', marginRight: 4, color: accent }} />}{settings.phone}
                </div>
                {settings.email && (
                    <div className="text-xs" style={styleFor('email')}>
                        {settings.show_icons && <MailIcon style={{ display: 'inline', marginRight: 4, color: accent }} />}{settings.email}
                    </div>
                )}
                {settings.website && <div className="text-xs" style={styleFor('website')}>{settings.website}</div>}
                {settings.map_link && <div className="text-xs"><a href={settings.map_link} target="_blank" rel="noreferrer" style={{ color: accent }}>Location</a></div>}
            </div>

            {/* Invoice Banner */}
            <div className="py-1 mb-2 text-xs" style={{ backgroundColor: accent, color: 'white', ...styleFor('invoice_banner') }}>
                INVOICE NO : {invoice.invoice_number}
            </div>

            {/* Customer Details */}
            <div className={`${settings.compact_mode ? 'mb-2' : 'mb-3'} text-xs`} style={styleFor('customer_section')}>
                <p className="mb-1"><strong>Date :</strong> {formatDate(invoice.created_at || new Date())}</p>
                <p className="mb-1"><strong>Customer :</strong> <span style={{ fontWeight: 900 }}>{customer?.name || 'Walk-In Customer'}</span>{customer?.phone ? <span style={{ fontWeight: 900 }}> ({customer.phone})</span> : ''}</p>
                <div className="flex justify-between mt-1">
                    {settings.show_served_by && <span>User: <span style={{ fontWeight: 700 }}>{user?.name || 'Admin User'}</span></span>}
                    {settings.show_date_time && <span>{new Date(invoice.created_at || new Date()).toLocaleTimeString('en-US', { hour12: true })}</span>}
                </div>
            </div>

            {/* Rx Table (Displaying first item's Rx if available) */}
            {settings.show_rx_table && parsedItems.find(i => i.prescription_data) && (
                <div className="mb-3">
                    {(() => {
                        const rxItem = parsedItems.find(i => i.prescription_data);
                        const rx = rxItem.prescription_data;

                        // Helper to safely get data
                        const getVal = (eye, type, field) => rx?.[eye]?.[type]?.[field] || '-';

                        return (
                            <div>
                                <table className="w-full text-center" style={{ fontSize: `${settings.rx_font_size || 15}px`, border: '1px dashed black', borderCollapse: 'collapse' }}>
                                    {/* HEADERS */}
                                    <thead>
                                        <tr>
                                            <th className="py-1 px-1" style={{ border: '1px dashed black' }}></th>
                                            <th className="py-1 px-1 font-black" colSpan="3" style={{ border: '1px dashed black', ...styleFor('rx_header') }}>Right</th>
                                            <th className="py-1 px-1 font-black" colSpan="3" style={{ border: '1px dashed black', ...styleFor('rx_header') }}>Left</th>
                                        </tr>
                                        <tr>
                                            <th className="py-1 px-1" style={{ border: '1px dashed black' }}></th>
                                            <th className="py-1 px-1 font-black" style={{ border: '1px dashed black', ...styleFor('rx_header') }}>SPH</th>
                                            <th className="py-1 px-1 font-black" style={{ border: '1px dashed black', ...styleFor('rx_header') }}>CYL</th>
                                            <th className="py-1 px-1 font-black" style={{ border: '1px dashed black', ...styleFor('rx_header') }}>AXIS</th>
                                            <th className="py-1 px-1 font-black" style={{ border: '1px dashed black', ...styleFor('rx_header') }}>SPH</th>
                                            <th className="py-1 px-1 font-black" style={{ border: '1px dashed black', ...styleFor('rx_header') }}>CYL</th>
                                            <th className="py-1 px-1 font-black" style={{ border: '1px dashed black', ...styleFor('rx_header') }}>AXIS</th>
                                        </tr>
                                    </thead>

                                    {/* VALUES */}
                                    <tbody>
                                        {(rx.right?.distance?.sph || rx.right?.distance?.cyl || rx.right?.distance?.axis || rx.left?.distance?.sph || rx.left?.distance?.cyl || rx.left?.distance?.axis) && (
                                            <tr>
                                                <td className="py-1 px-2 font-black text-left" style={{ border: '1px dashed black', ...styleFor('rx_header') }}>Dist</td>
                                                <td className="py-1 px-1 font-bold" style={{ border: '1px dashed black', ...styleFor('rx_value') }}>{getVal('right', 'distance', 'sph')}</td>
                                                <td className="py-1 px-1 font-bold" style={{ border: '1px dashed black', ...styleFor('rx_value') }}>{getVal('right', 'distance', 'cyl')}</td>
                                                <td className="py-1 px-1 font-bold" style={{ border: '1px dashed black', ...styleFor('rx_value') }}>{getVal('right', 'distance', 'axis')}</td>
                                                <td className="py-1 px-1 font-bold" style={{ border: '1px dashed black', ...styleFor('rx_value') }}>{getVal('left', 'distance', 'sph')}</td>
                                                <td className="py-1 px-1 font-bold" style={{ border: '1px dashed black', ...styleFor('rx_value') }}>{getVal('left', 'distance', 'cyl')}</td>
                                                <td className="py-1 px-1 font-bold" style={{ border: '1px dashed black', ...styleFor('rx_value') }}>{getVal('left', 'distance', 'axis')}</td>
                                            </tr>
                                        )}
                                        {(rx.right?.near?.sph || rx.right?.near?.cyl || rx.right?.near?.axis || rx.left?.near?.sph || rx.left?.near?.cyl || rx.left?.near?.axis) && (
                                            <tr>
                                                <td className="py-1 px-2 font-black text-left" style={{ border: '1px dashed black', ...styleFor('rx_header') }}>Near</td>
                                                <td className="py-1 px-1 font-bold" style={{ border: '1px dashed black', ...styleFor('rx_value') }}>{getVal('right', 'near', 'sph')}</td>
                                                <td className="py-1 px-1 font-bold" style={{ border: '1px dashed black', ...styleFor('rx_value') }}>{getVal('right', 'near', 'cyl')}</td>
                                                <td className="py-1 px-1 font-bold" style={{ border: '1px dashed black', ...styleFor('rx_value') }}>{getVal('right', 'near', 'axis')}</td>
                                                <td className="py-1 px-1 font-bold" style={{ border: '1px dashed black', ...styleFor('rx_value') }}>{getVal('left', 'near', 'sph')}</td>
                                                <td className="py-1 px-1 font-bold" style={{ border: '1px dashed black', ...styleFor('rx_value') }}>{getVal('left', 'near', 'cyl')}</td>
                                                <td className="py-1 px-1 font-bold" style={{ border: '1px dashed black', ...styleFor('rx_value') }}>{getVal('left', 'near', 'axis')}</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                                <table className="w-full mb-2" style={{ fontSize: `${settings.rx_font_size || 15}px`, border: '1px dashed black', borderTop: 'none', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                                    <tbody>
                                        <tr>
                                            <td className="py-1 px-2 font-bold text-left" style={{ ...styleFor('rx_header'), border: 'none', width: '100%' }}>
                                                Lens: <span style={{ ...styleFor('rx_value'), fontWeight: '700' }}>{rx.lensType || ''}</span>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        );
                    })()}
                </div>
            )}

            {/* Bill Header */}
            <div className="mb-2 text-xs" style={styleFor('bill_header')}>Bill</div>

            {/* Bill Table */}
            <table className="w-full text-left mb-2" style={{ fontSize: settings.text_styles?.table_body?.font_size ? `${settings.text_styles.table_body.font_size}px` : `${settings.compact_mode ? 9 : 10}px`, fontFamily: settings.text_styles?.table_body?.font_family, border: '1px dashed black', borderCollapse: 'collapse' }}>
                <thead>
                    <tr>
                        <th className="py-1 px-2 text-center" style={{ border: '1px dashed black', ...styleFor('table_header') }}>Sl</th>
                        <th className="py-1 px-2" style={{ border: '1px dashed black', ...styleFor('table_header') }}>Item</th>
                        <th className="py-1 px-2 text-center" style={{ border: '1px dashed black', ...styleFor('table_header') }}>Qty</th>
                        <th className="py-1 px-2 text-center" style={{ border: '1px dashed black', ...styleFor('table_header') }}>Rate</th>
                        <th className="py-1 px-2 text-center" style={{ border: '1px dashed black', ...styleFor('table_header') }}>Total</th>
                    </tr>
                </thead>
                <tbody>
                    {parsedItems.map((item, index) => (
                        <tr key={index}>
                            <td className="py-1 px-2 text-center" style={{ border: '1px dashed black' }}>{index + 1}</td>
                            <td className="py-1 px-2" style={{ border: '1px dashed black', fontWeight: '600' }}>{item.item_name || item.name}</td>
                            <td className="py-1 px-2 text-center" style={{ border: '1px dashed black' }}>{item.quantity}</td>
                            <td className="py-1 px-2 text-center" style={{ border: '1px dashed black' }}>{item.unit_price || item.price}</td>
                            <td className="py-1 px-2 text-center" style={{ border: '1px dashed black' }}>{((item.unit_price || item.price) * item.quantity).toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Totals */}
            <div className="flex justify-end text-xs mb-2">
                <div style={{ width: '45%' }}>
                    <div className="flex justify-between py-1">
                        <span style={styleFor('totals_labels')}>Total</span>
                        <span style={styleFor('totals_values')}><span style={{ fontWeight: 900, fontSize: '14px' }}>{settings.currency_symbol || '৳'}</span>{Number(invoice.total_amount).toFixed(1)}</span>
                    </div>
                    <div className="flex justify-between py-1">
                        <span style={styleFor('totals_labels')}>Discount</span>
                        <span style={styleFor('totals_values')}><span style={{ fontWeight: 900, fontSize: '14px' }}>{settings.currency_symbol || '৳'}</span>{Number(invoice.discount || 0).toFixed(1)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-t border-black" style={{ borderTopStyle: 'dashed' }}>
                        <span style={styleFor('totals_labels')}>Paid Payment</span>
                        <span style={styleFor('totals_values')}><span style={{ fontWeight: 900, fontSize: '14px' }}>{settings.currency_symbol || '৳'}</span>{Number(invoice.paid_amount || 0).toFixed(1)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-t border-black" style={{ borderTopStyle: 'dashed' }}>
                        <span style={styleFor('totals_labels')}>Due</span>
                        <span style={styleFor('totals_values')}><span style={{ fontWeight: 900, fontSize: '14px' }}>{settings.currency_symbol || '৳'}</span>{(netTotal - (invoice.paid_amount || 0)).toFixed(1)}</span>
                    </div>
                </div>
            </div>

            {/* In Words */}
            <div className="mb-2" style={styleFor('in_words')}>
                In Words : {amountInWords.toLowerCase()} Taka Only .
            </div>

            {/* Note */}
            {settings.show_note && invoice.note && (
                <div className="mb-2 text-xs">
                    <span style={styleFor('note_label')}>Note:</span> <span style={styleFor('note_text')}>{invoice.note}</span>
                </div>
            )}

            <div className="text-center mt-4 text-xs">
                <p className="mb-1" style={styleFor('farewell_text_style')}>{settings.farewell_text || 'Come Again'}</p>
                <p style={styleFor('footer_text_style')}>{settings.footer_text} 👓</p>
                {settings.show_signature && (
                    <div className="mt-4">
                        <div className="flex justify-between text-xs">
                            <div style={{ width: '45%' }}>
                                <div className="border-t border-black pt-1" style={styleFor('signature_customer_label')}>Customer Signature</div>
                            </div>
                            <div style={{ width: '45%' }}>
                                <div className="border-t border-black pt-1" style={styleFor('signature_authorized_label')}>Authorized Signature</div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
});

export default InvoicePrint; // Export component
