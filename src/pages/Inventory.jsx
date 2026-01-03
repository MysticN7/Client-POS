import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import API_URL from '../config/api';
import { Plus, Edit, Trash2, Search, Filter } from 'lucide-react';

const Inventory = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [categories, setCategories] = useState([]);
    const [categoryFilter, setCategoryFilter] = useState('ALL');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [currentProduct, setCurrentProduct] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        sku: '',
        category: 'FRAMES',
        price: '',
        stockQuantity: '',
        description: ''
    });
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [additionalStock, setAdditionalStock] = useState('');

    useEffect(() => {
        fetchProducts();
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const res = await api.get('/categories');
            setCategories(res.data);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const handleAddCategory = async (e) => {
        e.preventDefault();
        try {
            await api.post('/categories', { name: newCategoryName });
            setNewCategoryName('');
            fetchCategories();
        } catch (error) {
            alert('Failed to add category');
        }
    };

    const handleDeleteCategory = async (id) => {
        if (!window.confirm('Delete this category?')) return;
        try {
            await api.delete(`/categories/${id}`);
            fetchCategories();
        } catch (error) {
            alert('Failed to delete category');
        }
    };

    const fetchProducts = async () => {
        try {
            const response = await api.get('/products');
            setProducts(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching products:', error);
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const formDataToSend = new FormData();
            formDataToSend.append('name', formData.name);
            formDataToSend.append('sku', formData.sku);
            formDataToSend.append('category', formData.category);
            formDataToSend.append('price', formData.price || 0);
            formDataToSend.append('description', formData.description);

            if (imageFile) {
                formDataToSend.append('image', imageFile);
            }

            if (currentProduct) {
                if (additionalStock && Number(additionalStock) > 0) {
                    formDataToSend.append('additionalStock', Number(additionalStock));
                } else {
                    formDataToSend.append('stockQuantity', formData.stockQuantity);
                }
                await api.put(`/products/${currentProduct.id}`, formDataToSend);
            } else {
                formDataToSend.append('stockQuantity', formData.stockQuantity || 0);
                await api.post('/products', formDataToSend);
            }

            fetchProducts();
            closeModal();
        } catch (error) {
            console.error('Error saving product:', error);
            const msg = error.response?.data?.message || 'Failed to save product';
            alert(`Error: ${msg}`);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this product?')) {
            try {
                await api.delete(`/products/${id}`);
                fetchProducts();
            } catch (error) {
                console.error('Error deleting product:', error);
            }
        }
    };

    const openModal = (product = null) => {
        if (product) {
            setCurrentProduct(product);
            setFormData({
                name: product.name || '',
                sku: product.sku || '',
                category: product.category || '',
                price: product.price || '',
                stockQuantity: product.stockQuantity || '',
                description: product.description || ''
            });
            setImagePreview(product.imageUrl ? (product.imageUrl.startsWith('http') ? product.imageUrl : `${API_URL}${product.imageUrl}`) : null);
        } else {
            setCurrentProduct(null);
            setFormData({
                name: '',
                sku: '',
                category: '',
                price: '',
                stockQuantity: '',
                description: ''
            });
            setImagePreview(null);
        }
        setImageFile(null);
        setAdditionalStock('');
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setCurrentProduct(null);
        setImageFile(null);
        setImagePreview(null);
        setAdditionalStock('');
    };

    const filteredProducts = products.filter(product => {
        if (!product) return false;
        const name = product.name ? String(product.name).toLowerCase() : '';
        const sku = product.sku ? String(product.sku).toLowerCase() : '';
        const term = searchTerm ? String(searchTerm).toLowerCase() : '';

        const matchesSearch = name.includes(term) || sku.includes(term);
        const matchesCategory = categoryFilter === 'ALL' || product.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="p-3 sm:p-6 bg-gray-50 dark:bg-gray-900 min-h-screen dark:text-gray-100">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 sm:mb-6">
                <h1 className="text-xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100">Inventory</h1>
                <div className="flex gap-2 w-full sm:w-auto">
                    <button
                        onClick={() => setIsCategoryModalOpen(true)}
                        className="flex-1 sm:flex-none bg-purple-600 text-white px-3 sm:px-4 py-2 rounded-lg flex items-center justify-center gap-1 sm:gap-2 hover:bg-purple-700 transition text-sm sm:text-base"
                    >
                        <Filter size={16} /> <span className="hidden sm:inline">Categories</span><span className="sm:hidden">Cat</span>
                    </button>
                    <button
                        onClick={() => openModal()}
                        className="flex-1 sm:flex-none bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg flex items-center justify-center gap-1 sm:gap-2 hover:bg-blue-700 transition text-sm sm:text-base"
                    >
                        <Plus size={16} /> <span className="hidden sm:inline">Add Product</span><span className="sm:hidden">Add</span>
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-3 sm:p-4 mb-4 sm:mb-6">
                <div className="flex gap-2 sm:gap-4 flex-col sm:flex-row">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-300" size={18} />
                        <input
                            type="text"
                            placeholder="Search..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100 text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select
                        className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100 text-sm"
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                    >
                        <option value="ALL">All ({products.length})</option>
                        {categories.map(cat => {
                            const count = products.filter(p => p.category === cat.name).length;
                            return (
                                <option key={cat.id} value={cat.name}>{cat.name} ({count})</option>
                            );
                        })}
                    </select>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-100 dark:border-gray-700">
                            <tr>
                                <th className="px-2 sm:px-4 py-3 font-semibold text-gray-600 dark:text-gray-300 hidden sm:table-cell">Img</th>
                                <th className="px-2 sm:px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Name</th>
                                <th className="px-2 sm:px-4 py-3 font-semibold text-gray-600 dark:text-gray-300 hidden md:table-cell">SKU</th>
                                <th className="px-2 sm:px-4 py-3 font-semibold text-gray-600 dark:text-gray-300 hidden lg:table-cell">Category</th>
                                <th className="px-2 sm:px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Price</th>
                                <th className="px-2 sm:px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Stock</th>
                                <th className="px-2 sm:px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {loading ? (
                                <tr><td colSpan="7" className="text-center py-8 text-gray-500 dark:text-gray-300">Loading...</td></tr>
                            ) : filteredProducts.length === 0 ? (
                                <tr><td colSpan="7" className="text-center py-8 text-gray-500 dark:text-gray-300">No products found</td></tr>
                            ) : (
                                filteredProducts.map(product => (
                                    <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                                        <td className="px-2 sm:px-4 py-2 hidden sm:table-cell">
                                            {product.imageUrl ? (
                                                <img
                                                    src={product.imageUrl.startsWith('http') ? product.imageUrl : `${API_URL}${product.imageUrl}`}
                                                    alt={product.name}
                                                    className="w-10 h-10 sm:w-12 sm:h-12 object-cover rounded border border-gray-200 dark:border-gray-700"
                                                    onError={(e) => {
                                                        e.target.onerror = null;
                                                        e.target.src = NO_IMAGE_PLACEHOLDER;
                                                    }}
                                                />
                                            ) : (
                                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center">
                                                    <span className="text-gray-400 text-[10px]">N/A</span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-2 sm:px-4 py-2 font-medium text-gray-800 dark:text-gray-100 max-w-[120px] sm:max-w-none truncate">{product.name}</td>
                                        <td className="px-2 sm:px-4 py-2 text-gray-600 dark:text-gray-300 hidden md:table-cell">{product.sku}</td>
                                        <td className="px-2 sm:px-4 py-2 hidden lg:table-cell">
                                            {!product.category ? (
                                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400">None</span>
                                            ) : (() => {
                                                const vibrantColors = [
                                                    'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
                                                    'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
                                                    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
                                                    'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
                                                    'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
                                                    'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
                                                    'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300',
                                                    'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
                                                    'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
                                                    'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
                                                ];
                                                const hash = product.category.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                                                return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${vibrantColors[hash % vibrantColors.length]}`}>{product.category}</span>;
                                            })()}
                                        </td>
                                        <td className="px-2 sm:px-4 py-2 text-gray-600 dark:text-gray-300">৳{product.price}</td>
                                        <td className="px-2 sm:px-4 py-2">
                                            <span className={`font-medium ${product.stockQuantity < 10 ? 'text-red-600' : 'text-green-600'}`}>
                                                {product.stockQuantity}
                                            </span>
                                        </td>
                                        <td className="px-2 sm:px-4 py-2">
                                            <div className="flex gap-1 sm:gap-2">
                                                <button
                                                    onClick={() => openModal(product)}
                                                    className="bg-blue-600 text-white p-1.5 sm:px-2 sm:py-1 rounded text-xs hover:bg-blue-700 transition"
                                                    title="Edit"
                                                >
                                                    <Edit size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(product.id)}
                                                    className="text-red-600 hover:text-red-800 p-1.5"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg max-w-md w-full p-6">
                        <h2 className="text-2xl font-bold mb-6 text-gray-800">
                            {currentProduct ? 'Edit Product' : 'Add New Product'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Product Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    required
                                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">SKU (optional)</label>
                                    <input
                                        type="text"
                                        name="sku"
                                        className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                                        value={formData.sku}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                                    <select
                                        name="category"
                                        className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                                        value={formData.category}
                                        onChange={handleInputChange}
                                    >
                                        <option value="">No Category</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.name}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Price (Optional)</label>
                                    <input
                                        type="number"
                                        name="price"
                                        min="0"
                                        step="0.01"
                                        className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                                        value={formData.price}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Stock Quantity{currentProduct ? ' (current)' : ''}</label>
                                    <input
                                        type="number"
                                        name="stockQuantity"
                                        min="0"
                                        className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                                        value={formData.stockQuantity}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </div>
                            {currentProduct && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Add Stock</label>
                                        <input
                                            type="number"
                                            min="0"
                                            className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                                            value={additionalStock}
                                            onChange={(e) => setAdditionalStock(e.target.value)}
                                        />
                                    </div>
                                    <div className="flex items-end">
                                        <div className="text-sm text-gray-600 dark:text-gray-300">
                                            {Number(formData.stockQuantity) || 0} + {Number(additionalStock) || 0} = <span className="font-bold text-green-700">{(Number(formData.stockQuantity) || 0) + (Number(additionalStock) || 0)}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                                <textarea
                                    name="description"
                                    rows="3"
                                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                ></textarea>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Product Image (Optional)</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                                />
                                {imagePreview && (
                                    <div className="mt-3">
                                        <img
                                            src={imagePreview}
                                            alt="Preview"
                                            className="w-32 h-32 object-cover rounded-lg border-2 border-gray-300 dark:border-gray-700"
                                        />
                                    </div>
                                )}
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                                >
                                    Save Product
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Category Management Modal */}
            {isCategoryModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg max-w-md w-full p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Manage Categories</h2>
                            <button onClick={() => setIsCategoryModalOpen(false)} className="text-gray-500 hover:text-gray-700">X</button>
                        </div>

                        <form onSubmit={handleAddCategory} className="flex gap-2 mb-4">
                            <input
                                className="flex-1 border dark:border-gray-700 p-2 rounded dark:bg-gray-900 dark:text-gray-100"
                                placeholder="New Category Name"
                                value={newCategoryName}
                                onChange={e => setNewCategoryName(e.target.value)}
                                required
                            />
                            <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">Add</button>
                        </form>

                        <div className="max-h-60 overflow-y-auto space-y-2">
                            {categories.map(cat => (
                                <div key={cat.id || cat._id} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded gap-2">
                                    <input
                                        className="flex-1 font-medium dark:text-gray-100 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none px-1"
                                        defaultValue={cat.name}
                                        onBlur={async (e) => {
                                            const newName = e.target.value.trim();
                                            if (newName && newName !== cat.name) {
                                                try {
                                                    await api.put(`/categories/${cat.id || cat._id}`, { name: newName });
                                                    fetchCategories();
                                                } catch (err) {
                                                    alert('Failed to update category');
                                                    e.target.value = cat.name;
                                                }
                                            }
                                        }}
                                        onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
                                    />
                                    <button onClick={() => handleDeleteCategory(cat.id || cat._id)} className="text-red-500 hover:text-red-700 shrink-0">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Inventory;
const NO_IMAGE_PLACEHOLDER = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64'><rect width='100%' height='100%' fill='%23f3f4f6'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-size='10'>No Image</text></svg>";
