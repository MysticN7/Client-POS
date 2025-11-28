import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Plus, Check, Truck, Clock } from 'lucide-react';
import API_URL from '../config/api';

export default function JobCards() {
    const [jobCards, setJobCards] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [customers, setCustomers] = useState([]);
    const [formData, setFormData] = useState({
        customer_id: '',
        delivery_date: '',
        notes: '',
        prescription_snapshot: {
            right: { distance: { sph: '', cyl: '', axis: '' }, near: { sph: '', cyl: '', axis: '' } },
            left: { distance: { sph: '', cyl: '', axis: '' }, near: { sph: '', cyl: '', axis: '' } },
            lensType: '',
            remarks: ''
        }
    });
    const [imageFile, setImageFile] = useState(null);

    useEffect(() => {
        fetchJobCards();
        fetchCustomers();
    }, []);

    const fetchJobCards = async () => {
        try {
            const res = await api.get('/job-cards');
            setJobCards(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchCustomers = async () => {
        try {
            const res = await api.get('/customers/search?query=');
            setCustomers(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const data = new FormData();
            data.append('customer_id', formData.customer_id);
            data.append('delivery_date', formData.delivery_date);
            data.append('notes', formData.notes);
            data.append('prescription_snapshot', JSON.stringify(formData.prescription_snapshot));
            if (imageFile) {
                data.append('image', imageFile);
            }

            await api.post('/job-cards', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setShowForm(false);
            fetchJobCards();
            setFormData({
                customer_id: '',
                delivery_date: '',
                notes: '',
                prescription_snapshot: {
                    right: { distance: { sph: '', cyl: '', axis: '' }, near: { sph: '', cyl: '', axis: '' } },
                    left: { distance: { sph: '', cyl: '', axis: '' }, near: { sph: '', cyl: '', axis: '' } },
                    lensType: '',
                    remarks: ''
                }
            });
            setImageFile(null);
        } catch (err) {
            alert('Error creating job card');
        }
    };

    const updateStatus = async (id, status) => {
        try {
            await api.put(`/job-cards/${id}/status`, { status });
            fetchJobCards();
        } catch (err) {
            alert('Error updating status');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Pending': return 'bg-yellow-100 text-yellow-800';
            case 'Processing': return 'bg-blue-100 text-blue-800';
            case 'Ready': return 'bg-green-100 text-green-800';
            case 'Delivered': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100';
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Job Cards (Lab Orders)</h2>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="bg-blue-600 text-white px-4 py-2 rounded flex items-center hover:bg-blue-700"
                >
                    <Plus className="w-4 h-4 mr-2" /> New Job Card
                </button>
            </div>

            {showForm && (
                <div className="bg-white p-6 rounded shadow mb-6">
                    <h3 className="text-lg font-bold mb-4">New Job Card</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <select
                                className="border p-2 rounded"
                                value={formData.customer_id}
                                onChange={e => setFormData({ ...formData, customer_id: e.target.value })}
                                required
                            >
                                <option value="">Select Customer</option>
                                {customers.map(c => <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>)}
                            </select>
                            <input
                                type="date"
                                className="border p-2 rounded"
                                value={formData.delivery_date}
                                onChange={e => setFormData({ ...formData, delivery_date: e.target.value })}
                                required
                            />
                        </div>

                        <div className="border p-4 rounded bg-gray-50">
                            <h4 className="font-bold mb-2">Prescription Details</h4>

                            {/* Right Eye */}
                            <div className="mb-4">
                                <h5 className="font-bold text-sm mb-1">Right Eye</h5>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs font-bold text-gray-500 mb-1">Distance</p>
                                        <div className="grid grid-cols-3 gap-1">
                                            {['sph', 'cyl', 'axis'].map(field => (
                                                <input
                                                    key={field}
                                                    placeholder={field.toUpperCase()}
                                                    className="border p-1 rounded w-full text-sm"
                                                    value={formData.prescription_snapshot.right.distance[field]}
                                                    onChange={e => {
                                                        const newSnapshot = { ...formData.prescription_snapshot };
                                                        newSnapshot.right.distance[field] = e.target.value;
                                                        setFormData({ ...formData, prescription_snapshot: newSnapshot });
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-500 mb-1">Near</p>
                                        <div className="grid grid-cols-3 gap-1">
                                            {['sph', 'cyl', 'axis'].map(field => (
                                                <input
                                                    key={field}
                                                    placeholder={field.toUpperCase()}
                                                    className="border p-1 rounded w-full text-sm"
                                                    value={formData.prescription_snapshot.right.near[field]}
                                                    onChange={e => {
                                                        const newSnapshot = { ...formData.prescription_snapshot };
                                                        newSnapshot.right.near[field] = e.target.value;
                                                        setFormData({ ...formData, prescription_snapshot: newSnapshot });
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Left Eye */}
                            <div className="mb-4">
                                <h5 className="font-bold text-sm mb-1">Left Eye</h5>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs font-bold text-gray-500 mb-1">Distance</p>
                                        <div className="grid grid-cols-3 gap-1">
                                            {['sph', 'cyl', 'axis'].map(field => (
                                                <input
                                                    key={field}
                                                    placeholder={field.toUpperCase()}
                                                    className="border p-1 rounded w-full text-sm"
                                                    value={formData.prescription_snapshot.left.distance[field]}
                                                    onChange={e => {
                                                        const newSnapshot = { ...formData.prescription_snapshot };
                                                        newSnapshot.left.distance[field] = e.target.value;
                                                        setFormData({ ...formData, prescription_snapshot: newSnapshot });
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-500 mb-1">Near</p>
                                        <div className="grid grid-cols-3 gap-1">
                                            {['sph', 'cyl', 'axis'].map(field => (
                                                <input
                                                    key={field}
                                                    placeholder={field.toUpperCase()}
                                                    className="border p-1 rounded w-full text-sm"
                                                    value={formData.prescription_snapshot.left.near[field]}
                                                    onChange={e => {
                                                        const newSnapshot = { ...formData.prescription_snapshot };
                                                        newSnapshot.left.near[field] = e.target.value;
                                                        setFormData({ ...formData, prescription_snapshot: newSnapshot });
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold mb-1">Lens Type</label>
                                    <input
                                        className="border p-1 rounded w-full text-sm"
                                        value={formData.prescription_snapshot.lensType}
                                        onChange={e => {
                                            const newSnapshot = { ...formData.prescription_snapshot };
                                            newSnapshot.lensType = e.target.value;
                                            setFormData({ ...formData, prescription_snapshot: newSnapshot });
                                        }}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold mb-1">Remarks</label>
                                    <input
                                        className="border p-1 rounded w-full text-sm"
                                        value={formData.prescription_snapshot.remarks}
                                        onChange={e => {
                                            const newSnapshot = { ...formData.prescription_snapshot };
                                            newSnapshot.remarks = e.target.value;
                                            setFormData({ ...formData, prescription_snapshot: newSnapshot });
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        <textarea
                            placeholder="Lab Notes / Instructions"
                            className="border p-2 rounded w-full"
                            value={formData.notes}
                            onChange={e => setFormData({ ...formData, notes: e.target.value })}
                        />

                        <div>
                            <label className="block text-sm font-bold mb-1">Upload Prescription Image (Optional)</label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={e => setImageFile(e.target.files[0])}
                                className="border p-2 rounded w-full"
                            />
                        </div>

                        <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Create Job Card</button>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {jobCards.map(card => (
                    <div key={card.id} className="bg-white p-6 rounded shadow border-t-4 border-blue-500">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="font-bold text-lg">{card.job_number}</h3>
                                <p className="text-sm text-gray-500">{card.Customer?.name}</p>
                            </div>
                            <span className={`px-2 py-1 rounded text-xs font-bold ${getStatusColor(card.status)}`}>
                                {card.status}
                            </span>
                        </div>

                        <div className="mb-4 text-sm">
                            <p><strong>Delivery:</strong> {card.delivery_date}</p>
                            <p><strong>Notes:</strong> {card.notes}</p>
                            {card.prescription_image_path && (
                                <div className="mt-2">
                                    <p className="font-bold text-xs mb-1">Prescription Image:</p>
                                    <a href={`${API_URL}/${card.prescription_image_path}`} target="_blank" rel="noopener noreferrer">
                                        <img
                                            src={`${API_URL}/${card.prescription_image_path}`}
                                            alt="Prescription"
                                            className="w-full h-32 object-cover rounded border hover:opacity-75 transition-opacity"
                                        />
                                    </a>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-between mt-4 pt-4 border-t">
                            {card.status === 'Pending' && (
                                <button onClick={() => updateStatus(card.id, 'Processing')} className="text-blue-600 text-sm font-bold flex items-center">
                                    <Clock className="w-4 h-4 mr-1" /> Start Process
                                </button>
                            )}
                            {card.status === 'Processing' && (
                                <button onClick={() => updateStatus(card.id, 'Ready')} className="text-green-600 text-sm font-bold flex items-center">
                                    <Check className="w-4 h-4 mr-1" /> Mark Ready
                                </button>
                            )}
                            {card.status === 'Ready' && (
                                <button onClick={() => updateStatus(card.id, 'Delivered')} className="text-gray-600 text-sm font-bold flex items-center">
                                    <Truck className="w-4 h-4 mr-1" /> Mark Delivered
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
