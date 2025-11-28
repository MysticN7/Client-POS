import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Trash2, Edit, Check } from 'lucide-react';

const PERMISSIONS_LIST = ['DASHBOARD', 'POS', 'INVENTORY', 'EXPENSES', 'REPORTS', 'JOBCARDS', 'SETTINGS', 'USERS'];

export default function Users() {
    const [users, setUsers] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'SALESPERSON', permissions: [] });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/users');
            setUsers(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingUser) {
                await api.put(`/users/${editingUser.id}`, formData);
            } else {
                await api.post('/users', formData);
            }
            setShowModal(false);
            setEditingUser(null);
            setFormData({ name: '', email: '', password: '', role: 'SALESPERSON', permissions: [] });
            fetchUsers();
        } catch (err) {
            alert('Error saving user');
        }
    };

    const handleEdit = (user) => {
        setEditingUser(user);
        setFormData({
            name: user.name,
            email: user.email,
            password: '',
            role: user.role,
            permissions: Array.isArray(user.permissions) ? user.permissions : JSON.parse(user.permissions || '[]')
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure?')) return;
        try {
            await api.delete(`/users/${id}`);
            fetchUsers();
        } catch (err) {
            alert('Error deleting user');
        }
    };

    const togglePermission = (perm) => {
        setFormData(prev => {
            const newPerms = prev.permissions.includes(perm)
                ? prev.permissions.filter(p => p !== perm)
                : [...prev.permissions, perm];
            return { ...prev, permissions: newPerms };
        });
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">User Management</h1>
                <button
                    onClick={() => {
                        setEditingUser(null);
                        setFormData({ name: '', email: '', password: '', role: 'SALESPERSON', permissions: [] });
                        setShowModal(true);
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded"
                >
                    Add User
                </button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="p-4 text-left">Name</th>
                            <th className="p-4 text-left">Email</th>
                            <th className="p-4 text-left">Role</th>
                            <th className="p-4 text-left">Permissions</th>
                            <th className="p-4 text-left">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id} className="border-t">
                                <td className="p-4">{user.name}</td>
                                <td className="p-4">{user.email}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-xs ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <div className="flex flex-wrap gap-1">
                                        {user.role === 'ADMIN' ? (
                                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">ALL ACCESS</span>
                                        ) : (
                                            (Array.isArray(user.permissions) ? user.permissions : JSON.parse(user.permissions || '[]')).map(p => (
                                                <span key={p} className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded">{p}</span>
                                            ))
                                        )}
                                    </div>
                                </td>
                                <td className="p-4 flex space-x-2">
                                    <button onClick={() => handleEdit(user)} className="text-blue-600"><Edit size={18} /></button>
                                    <button onClick={() => handleDelete(user.id)} className="text-red-600"><Trash2 size={18} /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white p-6 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-4">{editingUser ? 'Edit User' : 'New User'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Name</label>
                                    <input className="w-full border p-2 rounded" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Email</label>
                                    <input className="w-full border p-2 rounded" type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Password {editingUser && '(Leave blank to keep)'}</label>
                                    <input className="w-full border p-2 rounded" type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Role</label>
                                    <select className="w-full border p-2 rounded" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}>
                                        <option value="SALESPERSON">Salesperson</option>
                                        <option value="MANAGER">Manager</option>
                                        <option value="ADMIN">Admin</option>
                                    </select>
                                </div>
                            </div>

                            {formData.role !== 'ADMIN' && (
                                <div>
                                    <label className="block text-sm font-medium mb-2">Permissions</label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {PERMISSIONS_LIST.map(perm => (
                                            <div key={perm}
                                                onClick={() => togglePermission(perm)}
                                                className={`cursor-pointer border p-2 rounded flex items-center justify-between ${formData.permissions.includes(perm) ? 'bg-blue-50 border-blue-500' : 'hover:bg-gray-50'}`}
                                            >
                                                <span className="text-sm">{perm}</span>
                                                {formData.permissions.includes(perm) && <Check size={16} className="text-blue-600" />}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end space-x-2 mt-6">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
