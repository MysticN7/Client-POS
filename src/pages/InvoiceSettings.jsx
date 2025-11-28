import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Save } from 'lucide-react';

export default function InvoiceSettings() {
    const [settings, setSettings] = useState({
        business_name: '',
        address: '',
        phone: '',
        email: '',
        website: '',
        map_link: '',
        footer_text: '',
        show_served_by: true,
        show_date_time: true,
        header_font_size: 12,
        body_font_size: 10,
        show_note: true,
        show_signature: false,
        accent_color: '#1f2937',
        theme: 'modern',
        show_icons: true,
        logo_url: '',
        show_logo: false,
        show_rx_table: true,
        paper_width_mm: 80,
        paper_margin_mm: 4,
        compact_mode: true,
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await api.get('/invoice-settings');
            setSettings(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.put('/invoice-settings', settings);
            alert('Settings updated successfully');
        } catch (err) {
            alert('Error updating settings');
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">Invoice Customization</h2>
            <div className="bg-white p-6 rounded shadow">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold mb-1">Business Name</label>
                            <input className="w-full border p-2 rounded" value={settings.business_name} onChange={e => setSettings({ ...settings, business_name: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-1">Phone</label>
                            <input className="w-full border p-2 rounded" value={settings.phone} onChange={e => setSettings({ ...settings, phone: e.target.value })} />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-bold mb-1">Address</label>
                            <input className="w-full border p-2 rounded" value={settings.address} onChange={e => setSettings({ ...settings, address: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-1">Email</label>
                            <input className="w-full border p-2 rounded" value={settings.email} onChange={e => setSettings({ ...settings, email: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-1">Website</label>
                            <input className="w-full border p-2 rounded" value={settings.website} onChange={e => setSettings({ ...settings, website: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-1">Maps Link</label>
                            <input className="w-full border p-2 rounded" value={settings.map_link} onChange={e => setSettings({ ...settings, map_link: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-1">Logo URL</label>
                            <input className="w-full border p-2 rounded" value={settings.logo_url} onChange={e => setSettings({ ...settings, logo_url: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-1">Accent Color</label>
                            <input type="color" className="w-full border p-2 rounded h-10" value={settings.accent_color} onChange={e => setSettings({ ...settings, accent_color: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-1">Theme</label>
                            <select className="w-full border p-2 rounded" value={settings.theme} onChange={e => setSettings({ ...settings, theme: e.target.value })}>
                                <option value="modern">Modern</option>
                                <option value="classic">Classic</option>
                                <option value="minimal">Minimal</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-1">Paper Width (mm)</label>
                            <input type="number" className="w-full border p-2 rounded" min="50" max="90" value={settings.paper_width_mm} onChange={e => setSettings({ ...settings, paper_width_mm: Number(e.target.value) })} />
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-1">Paper Margin (mm)</label>
                            <input type="number" className="w-full border p-2 rounded" min="0" max="10" value={settings.paper_margin_mm} onChange={e => setSettings({ ...settings, paper_margin_mm: Number(e.target.value) })} />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-bold mb-1">Footer Text</label>
                            <textarea className="w-full border p-2 rounded" rows="2" value={settings.footer_text} onChange={e => setSettings({ ...settings, footer_text: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-1">Header Font Size (px)</label>
                            <input type="number" className="w-full border p-2 rounded" value={settings.header_font_size} onChange={e => setSettings({ ...settings, header_font_size: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-1">Body Font Size (px)</label>
                            <input type="number" className="w-full border p-2 rounded" value={settings.body_font_size} onChange={e => setSettings({ ...settings, body_font_size: e.target.value })} />
                        </div>
                    </div>

                    <div className="flex space-x-6 pt-4 border-t flex-wrap">
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input type="checkbox" checked={settings.show_served_by} onChange={e => setSettings({ ...settings, show_served_by: e.target.checked })} />
                            <span>Show Served By</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input type="checkbox" checked={settings.show_date_time} onChange={e => setSettings({ ...settings, show_date_time: e.target.checked })} />
                            <span>Show Date & Time</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input type="checkbox" checked={settings.show_note} onChange={e => setSettings({ ...settings, show_note: e.target.checked })} />
                            <span>Show Note</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input type="checkbox" checked={settings.show_signature} onChange={e => setSettings({ ...settings, show_signature: e.target.checked })} />
                            <span>Show Signature Line</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input type="checkbox" checked={settings.show_icons} onChange={e => setSettings({ ...settings, show_icons: e.target.checked })} />
                            <span>Show Icons</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input type="checkbox" checked={settings.show_logo} onChange={e => setSettings({ ...settings, show_logo: e.target.checked })} />
                            <span>Show Logo</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input type="checkbox" checked={settings.show_rx_table} onChange={e => setSettings({ ...settings, show_rx_table: e.target.checked })} />
                            <span>Show Rx Table</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input type="checkbox" checked={settings.compact_mode} onChange={e => setSettings({ ...settings, compact_mode: e.target.checked })} />
                            <span>Compact Mode</span>
                        </label>
                    </div>

                    <div className="pt-4">
                        <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded flex items-center hover:bg-blue-700">
                            <Save className="w-4 h-4 mr-2" /> Save Settings
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
