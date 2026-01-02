import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Trash2, Edit, Check, Eye, EyeOff, Key } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Users() {
    const [users, setUsers] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'SALESPERSON', permissions: [] });
    const [showPassword, setShowPassword] = useState(false);
    const { user: currentUser } = useAuth();

    // Check if current user is ADMINISTRATIVE (can see passwords)
    const isAdministrative = currentUser?.role === 'ADMINISTRATIVE';

    const [permissionsCatalog, setPermissionsCatalog] = useState({ list: [], groups: {} });

    useEffect(() => {
        fetchUsers();
        fetchPermissions();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/users');
            setUsers(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchPermissions = async () => {
        try {
            const res = await api.get('/users/permissions');
            setPermissionsCatalog(res.data);
        } catch (err) {
            console.error('Failed to load permissions list');
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
                <h1 className="text-2xl font-bold dark:text-gray-100">User Management</h1>
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

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="p-4 text-left">Name</th>
                            {isAdministrative && <th className="p-4 text-left">Password</th>}
                            <th className="p-4 text-left">Role</th>
                            <th className="p-4 text-left">Permissions</th>
                            <th className="p-4 text-left">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id} className="border-t dark:border-gray-700">
                                <td className="p-4 font-medium">{user.name}</td>
                                {isAdministrative && (
                                    <td className="p-4">
                                        {user.lastSetPassword ? (
                                            <code className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded text-xs font-mono">
                                                {user.lastSetPassword}
                                            </code>
                                        ) : (
                                            <span className="text-gray-400 text-xs italic">Not set</span>
                                        )}
                                    </td>
                                )}
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-xs ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-200'}`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <div className="flex flex-wrap gap-1">
                                        {user.role === 'ADMIN' ? (
                                            <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200 px-2 py-1 rounded">ALL ACCESS</span>
                                        ) : (
                                            (Array.isArray(user.permissions) ? user.permissions : JSON.parse(user.permissions || '[]')).map(p => (
                                                <span key={p} className="text-xs bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-200 px-2 py-1 rounded">{p}</span>
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
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-4">{editingUser ? 'Edit User' : 'New User'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1 dark:text-gray-300">Name</label>
                                    <input className="w-full border p-2 rounded dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1 dark:text-gray-300">Email (optional)</label>
                                    <input className="w-full border p-2 rounded dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100" type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1 dark:text-gray-300 flex items-center gap-2">
                                        <Key size={14} />
                                        {editingUser ? 'Reset Password' : 'Password'}
                                        {editingUser && <span className="text-xs text-gray-500 dark:text-gray-400">(Leave blank to keep current)</span>}
                                    </label>
                                    <div className="relative">
                                        <input
                                            className="w-full border p-2 pr-10 rounded dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                                            type={showPassword ? 'text' : 'password'}
                                            value={formData.password}
                                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                                            placeholder={editingUser ? '••••••••' : 'Enter password'}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                    {formData.password && (
                                        <p className="text-xs text-green-600 dark:text-green-400 mt-1">✓ New password will be set on save</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1 dark:text-gray-300">Role</label>
                                    <select className="w-full border p-2 rounded dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100" value={formData.role} onChange={e => {
                                        const newRole = e.target.value;
                                        setFormData(prev => ({
                                            ...prev,
                                            role: newRole,
                                            permissions: newRole === 'ADMIN' ? permissionsCatalog.list : prev.permissions
                                        }));
                                    }}>
                                        <option value="SALESPERSON">Salesperson</option>
                                        <option value="MANAGER">Manager</option>
                                        <option value="ADMIN">Admin</option>
                                        {isAdministrative && <option value="ADMINISTRATIVE">Administrative</option>}
                                    </select>
                                </div>
                            </div>



                            {formData.role === 'ADMINISTRATIVE' && (
                                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 rounded text-sm mb-4">
                                    <strong>Super User:</strong> This role has full access to all system features including password viewing and audit log deletion. Permissions cannot be restricted.
                                </div>
                            )}

                            {formData.role !== 'ADMINISTRATIVE' && (
                                <div>
                                    <label className="block text-sm font-medium mb-2 dark:text-gray-300">Permissions</label>
                                    <div className="space-y-4">
                                        <div className="flex gap-2">
                                            <button type="button" onClick={() => setFormData(prev => ({ ...prev, permissions: permissionsCatalog.list }))} className="px-3 py-1 text-xs border rounded dark:border-gray-700">Select All</button>
                                            <button type="button" onClick={() => setFormData(prev => ({ ...prev, permissions: [] }))} className="px-3 py-1 text-xs border rounded dark:border-gray-700">Clear</button>
                                        </div>
                                        {Object.entries(permissionsCatalog.groups || {}).map(([groupName, perms]) => (
                                            <div key={groupName}>
                                                <div className="flex items-center justify-between mb-2">
                                                    <h4 className="text-sm font-bold dark:text-gray-100">{groupName}</h4>
                                                    <div className="flex gap-2">
                                                        <button type="button" onClick={() => setFormData(prev => ({ ...prev, permissions: Array.from(new Set([...(prev.permissions || []), ...perms])) }))} className="px-2 py-1 text-xs border rounded dark:border-gray-700">All</button>
                                                        <button type="button" onClick={() => setFormData(prev => ({ ...prev, permissions: (prev.permissions || []).filter(p => !perms.includes(p)) }))} className="px-2 py-1 text-xs border rounded dark:border-gray-700">None</button>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                                    {perms.map(perm => (
                                                        <div key={perm}
                                                            onClick={() => togglePermission(perm)}
                                                            className={`cursor-pointer border dark:border-gray-700 p-2 rounded flex items-center justify-between ${formData.permissions.includes(perm) ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 dark:border-blue-400' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                                                        >
                                                            <span className="text-xs dark:text-gray-100">{perm}</span>
                                                            {formData.permissions.includes(perm) && <Check size={16} className="text-blue-600" />}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end space-x-2 mt-6">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded dark:border-gray-700">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Save</button>
                            </div>
                        </form>
                    </div>
                </div >
            )
            }
        </div >
    );
}
