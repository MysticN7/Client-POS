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

                    <div className="flex space-x-6 pt-4 border-t">
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
