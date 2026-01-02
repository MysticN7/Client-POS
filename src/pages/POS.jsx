import { useState, useEffect, useRef } from 'react';
import api from '../api/axios';
import API_URL from '../config/api';
import { Search, ShoppingCart, Trash2, UserPlus, PauseCircle, PlayCircle, ChevronDown, ChevronUp } from 'lucide-react';
import InvoiceModal from '../components/InvoiceModal';
import SmartRxInput from '../components/SmartRxInput';
import { useAuth } from '../context/AuthContext';

export default function POS() {
    const { user } = useAuth();
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isCartExpanded, setIsCartExpanded] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('ALL');
    const [categories, setCategories] = useState(['ALL']);

    // Customer State
    const [customers, setCustomers] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [customerSearch, setCustomerSearch] = useState('');
    const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
    const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', address: '' });

    // Payment State
    const [discount, setDiscount] = useState(0);
    const [paidAmount, setPaidAmount] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState('Cash');


    const availableLensTypes = products
        .filter(p => p.category && (String(p.category).trim().toUpperCase() === 'LENS' || String(p.category).trim().toUpperCase() === 'LENSES') && p.stockQuantity > 0)
        .map(p => p.name);

    // Simple color assignment for lens types
    const getLensColor = (index) => {
        const colors = [
            'bg-blue-100 text-blue-800 border-blue-200',
            'bg-purple-100 text-purple-800 border-purple-200',
            'bg-green-100 text-green-800 border-green-200',
            'bg-indigo-100 text-indigo-800 border-indigo-200',
            'bg-teal-100 text-teal-800 border-teal-200',
            'bg-orange-100 text-orange-800 border-orange-200'
        ];
        return colors[index % colors.length];
    };
    const [note, setNote] = useState('');
    const [lastInvoice, setLastInvoice] = useState(null);
    const [heldTransactions, setHeldTransactions] = useState([]);
    const [showHeldModal, setShowHeldModal] = useState(false);
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);

    useEffect(() => {
        fetchProducts();
        fetchCategories();
        const saved = localStorage.getItem('heldTransactions');
        if (saved) setHeldTransactions(JSON.parse(saved));
    }, []);

    const fetchCategories = async () => {
        try {
            const res = await api.get('/categories');
            const catNames = res.data.map(c => c.name);
            setCategories(['ALL', ...catNames]);
        } catch (error) {
            console.error('Error fetching categories');
        }
    };

    useEffect(() => {
        if (customerSearch.length > 2) {
            searchCustomers();
        }
    }, [customerSearch]);

    const fetchProducts = async () => {
        const res = await api.get('/products');
        setProducts(res.data);
    };

    const searchCustomers = async () => {
        try {
            const res = await api.get(`/customers/search?query=${customerSearch}`);
            setCustomers(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const createCustomer = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/customers', newCustomer);
            setSelectedCustomer(res.data);
            setShowNewCustomerForm(false);
            setNewCustomer({ name: '', phone: '', address: '' });
        } catch (err) {
            alert('Error creating customer');
        }
    };

    const addToCart = (product) => {
        const category = product.category ? String(product.category).toUpperCase() : '';
        const isPrescription = category === 'FRAMES' || category === 'LENS' || category === 'LENSES';

        if (isPrescription) {
            setCart([...cart, {
                product_id: product.id || product._id,
                cart_item_id: Date.now() + Math.random(),
                name: product.name,
                price: product.price,
                quantity: 1,
                is_prescription_required: true,
                prescription_data: {
                    right: { distance: { sph: '', cyl: '', axis: '' }, near: { sph: '', cyl: '', axis: '' } },
                    left: { distance: { sph: '', cyl: '', axis: '' }, near: { sph: '', cyl: '', axis: '' } },
                    lensType: '',
                    remarks: ''
                }
            }]);
        } else {
            const existingIndex = cart.findIndex(item => item.product_id === (product.id || product._id) && !item.is_prescription_required);
            if (existingIndex >= 0) {
                const newCart = [...cart];
                newCart[existingIndex].quantity += 1;
                setCart(newCart);
            } else {
                setCart([...cart, {
                    product_id: product.id || product._id,
                    cart_item_id: Date.now() + Math.random(),
                    name: product.name,
                    price: product.price,
                    quantity: 1,
                    is_prescription_required: false,
                    prescription_data: null
                }]);
            }
        }
    };

    const updatePrice = (index, newPrice) => {
        const newCart = [...cart];
        newCart[index].price = Number(newPrice);
        setCart(newCart);
    };

    const updatePrescription = (index, eye, type, field, value) => {
        const newCart = [...cart];
        if (eye === 'extra') {
            newCart[index].prescription_data[field] = value;
        } else {
            newCart[index].prescription_data[eye][type][field] = value;
        }
        setCart(newCart);
    };

    const calculateTotal = () => {
        return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    };

    const handleHold = () => {
        if (cart.length === 0) return alert('Cart is empty');
        const transaction = {
            id: Date.now(),
            date: new Date().toLocaleString(),
            customer: selectedCustomer,
            cart: cart,
            discount: discount,
            paidAmount: paidAmount
        };
        const newHeld = [...heldTransactions, transaction];
        setHeldTransactions(newHeld);
        localStorage.setItem('heldTransactions', JSON.stringify(newHeld));
        setCart([]);
        setSelectedCustomer(null);
        setDiscount(0);
        setPaidAmount(0);
        alert('Transaction Held');
    };

    const handleRecall = (transaction) => {
        setCart(transaction.cart);
        setSelectedCustomer(transaction.customer);
        setDiscount(transaction.discount);
        setPaidAmount(transaction.paidAmount);

        const newHeld = heldTransactions.filter(t => t.id !== transaction.id);
        setHeldTransactions(newHeld);
        localStorage.setItem('heldTransactions', JSON.stringify(newHeld));
        setShowHeldModal(false);
    };

    const deleteHeld = (id) => {
        const newHeld = heldTransactions.filter(t => t.id !== id);
        setHeldTransactions(newHeld);
        localStorage.setItem('heldTransactions', JSON.stringify(newHeld));
    };

    const handleCheckout = async () => {
        let customerToUse = selectedCustomer;

        if (!customerToUse) {
            // Try to find or create Walk-in Customer
            try {
                const searchRes = await api.get('/customers/search?query=Walk-in');
                const walkIn = searchRes.data.find(c => c.name === 'Walk-in Customer');

                if (walkIn) {
                    customerToUse = walkIn;
                } else {
                    const createRes = await api.post('/customers', {
                        name: 'Walk-in Customer',
                        address: 'N/A'
                    });
                    customerToUse = createRes.data;
                }
                setSelectedCustomer(customerToUse);
            } catch (err) {
                console.error("Error fetching/creating walk-in customer", err);
                alert('Please select a customer first');
                return;
            }
        }

        const total = calculateTotal();

        try {
            const res = await api.post('/sales', {
                customer_id: customerToUse.id,
                items: cart.map(item => ({ ...item, unit_price: item.price })),
                discount: Number(discount),
                paid_amount: Number(paidAmount),
                payment_method: paymentMethod,
                note: note
            });

            setLastInvoice(res.data.invoice);

            setLastInvoice(res.data.invoice);
            setShowInvoiceModal(true);
        } catch (err) {
            alert('Checkout failed: ' + (err.response?.data?.message || err.message));
        }
    };



    const handleCloseModal = () => {
        setShowInvoiceModal(false);
        setCart([]);
        setDiscount(0);
        setPaidAmount(0);
        setNote('');
        setSelectedCustomer(null);
        setLastInvoice(null);
    };

    const filteredProducts = products.filter(p => {
        if (!p) return false;
        const name = p.name ? String(p.name).toLowerCase() : '';
        const sku = p.sku ? String(p.sku).toLowerCase() : '';
        const term = searchTerm ? String(searchTerm).toLowerCase() : '';

        // If searching, search across ALL categories
        if (term) {
            return name.includes(term) || sku.includes(term);
        }

        // Otherwise filter by selected category
        if (selectedCategory === 'ALL') return true;
        return p.category && String(p.category).toLowerCase() === String(selectedCategory).toLowerCase();
    });

    return (
        <div className="flex flex-col lg:flex-row h-full gap-4 lg:gap-6 dark:text-gray-100">
            {/* Invoice Modal */}
            {showInvoiceModal && (
                <InvoiceModal
                    invoice={lastInvoice}
                    items={cart}
                    customer={selectedCustomer || (lastInvoice ? { name: 'Customer' } : null)}
                    user={user}
                    onClose={handleCloseModal}
                />
            )}

            {/* Left Side: Products */}
            <div className="flex-1 flex flex-col order-2 lg:order-1">
                {/* Customer Selection */}
                <div className="bg-white dark:bg-gray-800 dark:border dark:border-gray-700 p-3 sm:p-4 rounded shadow mb-4">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-bold text-sm sm:text-base">Customer</h3>
                        <button onClick={() => setShowNewCustomerForm(!showNewCustomerForm)} className="text-blue-600 flex items-center text-xs sm:text-sm">
                            <UserPlus className="w-4 h-4 mr-1" /> New Customer
                        </button>
                    </div>

                    {showNewCustomerForm ? (
                        <form onSubmit={createCustomer} className="space-y-2">
                            <input placeholder="Name" className="border dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 p-2 sm:p-3 rounded w-full text-sm sm:text-base" value={newCustomer.name} onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })} required />
                            <input placeholder="Phone (optional)" className="border dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 p-2 sm:p-3 rounded w-full text-sm sm:text-base" value={newCustomer.phone} onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })} />
                            <button type="submit" className="bg-green-600 text-white px-4 py-2 sm:py-3 rounded w-full font-medium">Save Customer</button>
                        </form>
                    ) : (
                        <div>
                            {selectedCustomer ? (
                                <div className="flex justify-between items-center bg-blue-50 dark:bg-blue-900/20 p-2 rounded border border-blue-200 dark:border-gray-700">
                                    <div>
                                        <p className="font-bold text-sm sm:text-base">{selectedCustomer.name}</p>
                                        {selectedCustomer.phone && (
                                            <p className="text-xs text-gray-600 dark:text-gray-300">{selectedCustomer.phone}</p>
                                        )}
                                    </div>
                                    <button onClick={() => setSelectedCustomer(null)} className="text-red-500 text-xs sm:text-sm px-2 py-1">Change</button>
                                </div>
                            ) : (
                                <div className="relative">
                                    <input
                                        className="w-full p-2 sm:p-3 border dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded text-sm sm:text-base"
                                        placeholder="Search customer by name or phone..."
                                        value={customerSearch}
                                        onChange={e => setCustomerSearch(e.target.value)}
                                    />
                                    {customers.length > 0 && customerSearch && (
                                        <div className="absolute z-10 w-full bg-white dark:bg-gray-800 border dark:border-gray-700 shadow mt-1 max-h-40 overflow-auto">
                                            {customers.map(c => (
                                                <div key={c.id} onClick={() => { setSelectedCustomer(c); setCustomers([]); setCustomerSearch(''); }} className="p-2 sm:p-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-sm">
                                                    {c.name}{c.phone ? ` - ${c.phone}` : ''}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Category Navigation */}
                <div className="flex flex-wrap gap-2 mb-4">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all transform active:scale-95 shadow-sm border-2 ${selectedCategory === cat
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-indigo-200'
                                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-transparent hover:border-indigo-100 hover:bg-indigo-50 dark:hover:bg-gray-700'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Product Search & Grid */}
                <div className="mb-4 relative group">
                    <Search className="absolute left-3 top-2.5 sm:top-3 text-gray-400 w-4 h-4 sm:w-5 sm:h-5 pointer-events-none" />
                    <input
                        className="w-full pl-9 sm:pl-10 p-2 sm:p-3 border dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded-lg shadow-sm text-sm sm:text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                        placeholder="Search products..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        autoComplete="off"
                    />
                    {searchTerm && (
                        <div className="absolute z-[100] w-full bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-b-lg shadow-2xl max-h-80 overflow-y-auto top-full mt-1 divide-y dark:divide-gray-700 ring-1 ring-black ring-opacity-5">
                            {products.filter(p => {
                                const term = searchTerm.toLowerCase();
                                return (p.name && p.name.toLowerCase().includes(term)) || (p.sku && p.sku.toLowerCase().includes(term));
                            }).slice(0, 10).map(product => (
                                <div
                                    key={product.id}
                                    onClick={() => { addToCart(product); setSearchTerm(''); }}
                                    className="p-3 hover:bg-indigo-50 dark:hover:bg-gray-700 cursor-pointer flex items-center gap-3 transition-colors"
                                >
                                    <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-md overflow-hidden">
                                        {product.imageUrl ? (
                                            <img src={product.imageUrl.startsWith('http') ? product.imageUrl : `${API_URL}${product.imageUrl}`} className="w-full h-full object-cover" alt="" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">IMG</div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-bold text-gray-800 dark:text-white text-sm truncate">{product.name}</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">SKU: {product.sku}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold text-indigo-600 dark:text-indigo-400 text-sm">৳{product.price}</div>
                                        <div className={`text-[10px] px-1.5 py-0.5 rounded-full inline-block ${product.stockQuantity > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {product.stockQuantity > 0 ? `${product.stockQuantity} in stock` : 'Out'}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {products.filter(p => {
                                const term = searchTerm.toLowerCase();
                                return (p.name && p.name.toLowerCase().includes(term)) || (p.sku && p.sku.toLowerCase().includes(term));
                            }).length === 0 && (
                                    <div className="p-4 text-center text-gray-500 text-sm">No products found</div>
                                )}
                        </div>
                    )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 overflow-auto">
                    {filteredProducts.map(product => (
                        <div key={product.id} onClick={() => addToCart(product)} className="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded shadow cursor-pointer hover:shadow-md transition active:scale-95">
                            {product.imageUrl ? (
                                <img
                                    src={product.imageUrl?.startsWith('http') ? product.imageUrl : `${API_URL}${product.imageUrl}`}
                                    alt={product.name}
                                    className="w-full h-32 object-cover rounded-lg mb-3 border border-gray-200 dark:border-gray-700"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = NO_IMAGE_PLACEHOLDER;
                                        console.error('Error loading image:', product.imageUrl?.startsWith('http') ? product.imageUrl : `${API_URL}${product.imageUrl}`);
                                    }}
                                />
                            ) : (
                                <div className="w-full h-32 bg-gray-100 dark:bg-gray-700 rounded-lg mb-3 flex items-center justify-center border border-gray-200 dark:border-gray-700">
                                    <span className="text-gray-400 dark:text-gray-300 text-sm">No Image</span>
                                </div>
                            )}
                            <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm sm:text-base">{product.name}</h3>
                            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-300">SKU: {product.sku}</p>
                            <div className="flex justify-between items-center mt-2">
                                <span className="text-blue-600 font-bold text-sm sm:text-base">৳{product.price}</span>
                                <span className={`text-xs px-2 py-1 rounded ${product.stockQuantity > 0 ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200' : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200'}`}>
                                    Stock: {product.stockQuantity}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right Side: Cart & Payment */}
            <div className="w-full lg:w-96 bg-white dark:bg-gray-800 rounded-lg shadow-lg flex flex-col h-auto lg:h-full order-1 lg:order-2">
                <div onClick={() => setIsCartExpanded(!isCartExpanded)} className="p-3 sm:p-4 border-b bg-gray-50 dark:bg-gray-700 dark:border-gray-700 rounded-t-lg flex justify-between items-center cursor-pointer lg:cursor-default">
                    <div className="flex items-center gap-2">
                        <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
                        <h2 className="text-lg sm:text-xl font-bold">Current Sale</h2>
                        <span className="lg:hidden text-sm font-medium bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full dark:bg-blue-900/30 dark:text-blue-200">
                            {cart.length} items - ৳{calculateTotal().toFixed(0)}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm('Are you sure you want to clear the current sale?')) {
                                    setCart([]);
                                    setSelectedCustomer(null);
                                    setDiscount(0);
                                    setPaidAmount(0);
                                    setNote('');
                                }
                            }}
                            className="bg-gray-500 text-white px-2 sm:px-3 py-1 rounded text-xs sm:text-sm hover:bg-gray-600 z-10"
                        >
                            New Sales
                        </button>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsCartExpanded(!isCartExpanded);
                            }}
                            className="lg:hidden p-2 -mr-2 rounded-lg bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                            aria-label={isCartExpanded ? 'Collapse cart' : 'Expand cart'}
                        >
                            {isCartExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                <div className={`${isCartExpanded ? 'flex' : 'hidden lg:flex'} flex-col flex-1 min-h-0 max-h-[60vh] lg:max-h-none`}>

                    <div className="flex-1 min-h-0 overflow-auto p-3 sm:p-4 space-y-4 lg:max-h-none">
                        {cart.map((item, index) => (
                            <div key={index} className="border-b pb-4">
                                <div className="flex justify-between mb-2">
                                    <span className="font-medium text-sm sm:text-base">{item.name}</span>
                                    <div className="flex items-center space-x-1">
                                        <span className="text-xs text-gray-500">৳</span>
                                        <input
                                            type="number"
                                            className="w-20 border rounded px-1 text-right text-sm dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                                            value={item.price}
                                            onChange={(e) => updatePrice(index, e.target.value)}
                                            onClick={(e) => e.target.select()}
                                            inputMode="decimal"
                                        />
                                    </div>
                                </div>

                                {item.is_prescription_required && (
                                    <div className="text-xs sm:text-sm bg-gray-50 dark:bg-gray-800 p-3 sm:p-4 rounded mb-2 border border-gray-200 dark:border-gray-700 shadow-sm">
                                        {/* Right Eye */}
                                        <div className="mb-4">
                                            <h4 className="text-sm sm:text-base font-bold mb-2 text-gray-700 dark:text-gray-200 border-b dark:border-gray-700 pb-1">Right Eye</h4>
                                            {/* Distance */}
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="w-16 sm:w-20 text-right">
                                                    <span className="text-gray-500 dark:text-gray-400 font-medium block text-xs uppercase tracking-wider">Dist</span>
                                                </div>
                                                {['sph', 'cyl', 'axis'].map(field => (
                                                    <div key={field} className="flex-1">
                                                        <span className="text-gray-400 dark:text-gray-500 text-xs block text-center uppercase mb-1">{field}</span>
                                                        <SmartRxInput
                                                            className="w-full border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded p-2 text-center text-xs sm:text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                                                            placeholder="-"
                                                            value={item.prescription_data.right.distance[field]}
                                                            onChange={(e) => updatePrescription(index, 'right', 'distance', field, e.target.value)}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                            {/* Near */}
                                            <div className="flex items-center gap-2">
                                                <div className="w-16 sm:w-20 text-right">
                                                    <span className="text-gray-500 dark:text-gray-400 font-medium block text-xs uppercase tracking-wider">Near</span>
                                                </div>
                                                {['sph', 'cyl', 'axis'].map(field => (
                                                    <div key={field} className="flex-1">
                                                        <SmartRxInput
                                                            className="w-full border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded p-2 text-center text-xs sm:text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                                                            placeholder="-"
                                                            value={item.prescription_data.right.near[field]}
                                                            onChange={(e) => updatePrescription(index, 'right', 'near', field, e.target.value)}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Left Eye */}
                                        <div className="mb-4">
                                            <h4 className="text-sm sm:text-base font-bold mb-2 text-gray-700 dark:text-gray-200 border-b dark:border-gray-700 pb-1">Left Eye</h4>
                                            {/* Distance */}
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="w-16 sm:w-20 text-right">
                                                    <span className="text-gray-500 dark:text-gray-400 font-medium block text-xs uppercase tracking-wider">Dist</span>
                                                </div>
                                                {['sph', 'cyl', 'axis'].map(field => (
                                                    <div key={field} className="flex-1">
                                                        <span className="text-gray-400 dark:text-gray-500 text-xs block text-center uppercase mb-1">{field}</span>
                                                        <SmartRxInput
                                                            className="w-full border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded p-2 text-center text-xs sm:text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                                                            placeholder="-"
                                                            value={item.prescription_data.left.distance[field]}
                                                            onChange={(e) => updatePrescription(index, 'left', 'distance', field, e.target.value)}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                            {/* Near */}
                                            <div className="flex items-center gap-2">
                                                <div className="w-16 sm:w-20 text-right">
                                                    <span className="text-gray-500 dark:text-gray-400 font-medium block text-xs uppercase tracking-wider">Near</span>
                                                </div>
                                                {['sph', 'cyl', 'axis'].map(field => (
                                                    <div key={field} className="flex-1">
                                                        <SmartRxInput
                                                            className="w-full border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded p-2 text-center text-xs sm:text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                                                            placeholder="-"
                                                            value={item.prescription_data.left.near[field]}
                                                            onChange={(e) => updatePrescription(index, 'left', 'near', field, e.target.value)}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Extra Fields */}
                                        <div className="space-y-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                                            <div className="grid grid-cols-[auto_1fr] gap-3 items-center">
                                                <div className="w-16 sm:w-20 text-right">
                                                    <span className="text-gray-600 text-xs font-medium block">Lens Type</span>
                                                </div>
                                                <input
                                                    className="w-full border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded p-2 text-xs sm:text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                                    placeholder="e.g. Bifocal, Progressive"
                                                    value={item.prescription_data.lensType}
                                                    onChange={(e) => updatePrescription(index, 'extra', null, 'lensType', e.target.value)}
                                                />
                                            </div>
                                            {/* Quick Lens Selection */}
                                            <div className="flex flex-wrap gap-2 pl-16 sm:pl-20">
                                                {availableLensTypes.map((type, i) => (
                                                    <button
                                                        key={type}
                                                        onClick={() => updatePrescription(index, 'extra', null, 'lensType', type)}
                                                        className={`px-2 py-1 rounded text-[10px] sm:text-xs border ${getLensColor(i)} hover:opacity-80 transition-opacity`}
                                                    >
                                                        {type}
                                                    </button>
                                                ))}
                                            </div>
                                            <div className="grid grid-cols-[auto_1fr] gap-3 items-center">
                                                <div className="w-16 sm:w-20 text-right">
                                                    <span className="text-gray-600 text-xs font-medium block">Remarks</span>
                                                </div>
                                                <input
                                                    className="w-full border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded p-2 text-xs sm:text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                                    placeholder="Optional notes"
                                                    value={item.prescription_data.remarks}
                                                    onChange={(e) => updatePrescription(index, 'extra', null, 'remarks', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="flex justify-between items-center text-sm">
                                    <div className="flex items-center space-x-2">
                                        <button className="px-3 py-1 border rounded touch-manipulation active:bg-gray-100" onClick={() => {
                                            const newCart = [...cart];
                                            newCart[index].quantity > 1 ? newCart[index].quantity-- : newCart.splice(index, 1);
                                            setCart(newCart);
                                        }}>-</button>
                                        <span className="font-medium">{item.quantity}</span>
                                        <button className="px-3 py-1 border rounded touch-manipulation active:bg-gray-100" onClick={() => {
                                            const newCart = [...cart];
                                            newCart[index].quantity++;
                                            setCart(newCart);
                                        }}>+</button>
                                    </div>
                                    <button
                                        className="text-red-500 p-2 touch-manipulation"
                                        onClick={() => setCart(cart.filter((_, i) => i !== index))}
                                        aria-label="Remove item"
                                        data-testid={`remove-item-${index}`}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="p-3 border-t bg-gray-50 dark:bg-gray-700 rounded-b-lg space-y-2">
                        <div className="flex justify-between gap-2">
                            <div className="flex justify-between items-center w-1/2">
                                <span className="text-sm">Subtotal</span>
                                <span className="font-medium text-sm">৳{calculateTotal().toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center w-1/2">
                                <span className="text-sm">Discount</span>
                                <input
                                    type="number"
                                    className="w-20 border dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded p-1 text-right text-sm"
                                    value={discount}
                                    onChange={e => setDiscount(e.target.value)}
                                    inputMode="decimal"
                                />
                            </div>
                        </div>

                        <div className="flex justify-between items-center">
                            <span className="font-bold text-sm">Net Total</span>
                            <span className="font-bold text-lg">৳{(calculateTotal() - discount).toFixed(2)}</span>
                        </div>

                        <div className="flex justify-between gap-2">
                            <div className="flex justify-between items-center w-1/2">
                                <span className="text-sm">Paid</span>
                                <input
                                    type="number"
                                    className="w-20 border dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded p-1 text-right font-bold text-green-600 text-sm"
                                    value={paidAmount}
                                    onChange={e => setPaidAmount(e.target.value)}
                                    inputMode="decimal"
                                />
                            </div>
                            <div className="flex justify-between items-center w-1/2">
                                <span className="text-sm">Due</span>
                                <span className="text-red-600 font-bold text-sm">৳{(calculateTotal() - discount - paidAmount).toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <select
                                className="w-1/3 border dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 p-1 rounded text-sm"
                                value={paymentMethod}
                                onChange={e => setPaymentMethod(e.target.value)}
                            >
                                <option value="Cash">Cash</option>
                                <option value="Card">Card</option>
                                <option value="MFS">MFS</option>
                            </select>
                            <textarea
                                className="w-2/3 border dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 p-1 rounded text-xs"
                                placeholder="Note..."
                                rows="1"
                                value={note}
                                onChange={e => setNote(e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-4 gap-2">
                            <button onClick={handleHold} className="col-span-1 bg-yellow-500 text-white py-2 rounded font-bold hover:bg-yellow-600 flex justify-center items-center text-xs" title="Hold Transaction">
                                <PauseCircle className="w-4 h-4" />
                            </button>
                            <button onClick={() => setShowHeldModal(true)} className="col-span-1 bg-purple-600 text-white py-2 rounded font-bold hover:bg-purple-700 flex justify-center items-center text-xs" title="Recall Transaction">
                                <PlayCircle className="w-4 h-4" />
                            </button>
                            <button onClick={handleCheckout} className="col-span-2 bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-700 flex justify-center items-center text-sm">
                                Complete
                            </button>
                        </div>
                    </div>
                </div>
            </div >

            {/* Held Transactions Modal */}
            {
                showHeldModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
                        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded shadow-lg w-full max-w-2xl max-h-[80vh] overflow-y-auto">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-base sm:text-lg font-bold">Held Transactions</h3>
                                <button onClick={() => setShowHeldModal(false)} className="text-red-500 font-bold text-xl">X</button>
                            </div>
                            {heldTransactions.length === 0 ? <p className="text-sm sm:text-base">No held transactions.</p> : (
                                <div className="space-y-2">
                                    {heldTransactions.map(t => (
                                        <div key={t.id} className="border dark:border-gray-700 p-3 rounded flex flex-col sm:flex-row justify-between items-start sm:items-center hover:bg-gray-50 dark:hover:bg-gray-700 gap-2">
                                            <div className="flex-1">
                                                <p className="font-bold text-sm sm:text-base">{t.date}</p>
                                                <p className="text-xs sm:text-sm">Customer: {t.customer?.name || 'Walk-in'}</p>
                                                <p className="text-xs sm:text-sm">Items: {t.cart.length} | Total: ৳{t.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}</p>
                                            </div>
                                            <div className="flex space-x-2 w-full sm:w-auto">
                                                <button onClick={() => handleRecall(t)} className="flex-1 sm:flex-none bg-green-600 text-white px-3 py-2 rounded text-xs sm:text-sm touch-manipulation">Recall</button>
                                                <button onClick={() => deleteHeld(t.id)} className="flex-1 sm:flex-none bg-red-600 text-white px-3 py-2 rounded text-xs sm:text-sm touch-manipulation">Delete</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )
            }
        </div >
    );
}
const NO_IMAGE_PLACEHOLDER = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='150' height='150'><rect width='100%' height='100%' fill='%23f3f4f6'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-size='14'>No Image</text></svg>";
