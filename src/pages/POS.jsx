import { useState, useEffect, useRef } from 'react';
import api from '../api/axios';
import API_URL from '../config/api';
import { Search, ShoppingCart, Trash2, UserPlus, Printer, PauseCircle, PlayCircle } from 'lucide-react';
import InvoiceModal from '../components/InvoiceModal';
import { useAuth } from '../context/AuthContext';

export default function POS() {
    const { user } = useAuth();
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

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
    const [note, setNote] = useState('');
    const [lastInvoice, setLastInvoice] = useState(null);
    const [heldTransactions, setHeldTransactions] = useState([]);
    const [showHeldModal, setShowHeldModal] = useState(false);
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);

    useEffect(() => {
        fetchProducts();
        const saved = localStorage.getItem('heldTransactions');
        if (saved) setHeldTransactions(JSON.parse(saved));
    }, []);

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
        const existing = cart.find(item => item.product_id === product.id);
        if (existing) {
            setCart(cart.map(item => item.product_id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
        } else {
            setCart([...cart, {
                product_id: product.id,
                name: product.name,
                price: product.price,
                quantity: 1,
                is_prescription_required: product.category === 'FRAMES' || product.category === 'LENS',
                prescription_data: (product.category === 'FRAMES' || product.category === 'LENS') ? {
                    right: { distance: { sph: '', cyl: '', axis: '' }, near: { sph: '', cyl: '', axis: '' } },
                    left: { distance: { sph: '', cyl: '', axis: '' }, near: { sph: '', cyl: '', axis: '' } },
                    lensType: '',
                    remarks: ''
                } : null
            }]);
        }
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

    const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.includes(searchTerm));

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

                {/* Product Search & Grid */}
                <div className="mb-4 relative">
                    <Search className="absolute left-3 top-2.5 sm:top-3 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                    <input
                        className="w-full pl-9 sm:pl-10 p-2 sm:p-3 border dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded-lg shadow-sm text-sm sm:text-base"
                        placeholder="Search products..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
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
                <div className="p-3 sm:p-4 border-b bg-gray-50 dark:bg-gray-700 dark:border-gray-700 rounded-t-lg flex justify-between items-center">
                    <h2 className="text-lg sm:text-xl font-bold flex items-center"><ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 mr-2" /> Current Sale</h2>
                    <button
                        onClick={() => {
                            if (window.confirm('Are you sure you want to clear the current sale?')) {
                                setCart([]);
                                setSelectedCustomer(null);
                                setDiscount(0);
                                setPaidAmount(0);
                                setNote('');
                            }
                        }}
                        className="bg-gray-500 text-white px-2 sm:px-3 py-1 rounded text-xs sm:text-sm hover:bg-gray-600"
                    >
                        New Sales
                    </button>
                </div>

                <div className="flex-1 overflow-auto p-3 sm:p-4 space-y-4 max-h-96 lg:max-h-none">
                    {cart.map((item, index) => (
                        <div key={index} className="border-b pb-4">
                            <div className="flex justify-between mb-2">
                                <span className="font-medium text-sm sm:text-base">{item.name}</span>
                                <span className="font-bold text-sm sm:text-base">৳{(item.price * item.quantity).toFixed(2)}</span>
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
                                                    <input
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
                                                    <input
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
                                        <h4 className="text-sm sm:text-base font-bold mb-2 text-gray-700 border-b pb-1">Left Eye</h4>
                                        {/* Distance */}
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-16 sm:w-20 text-right">
                                                <span className="text-gray-500 font-medium block text-xs uppercase tracking-wider">Dist</span>
                                            </div>
                                            {['sph', 'cyl', 'axis'].map(field => (
                                                <div key={field} className="flex-1">
                                                    <span className="text-gray-400 text-xs block text-center uppercase mb-1">{field}</span>
                                                    <input
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
                                                <span className="text-gray-500 font-medium block text-xs uppercase tracking-wider">Near</span>
                                            </div>
                                            {['sph', 'cyl', 'axis'].map(field => (
                                                <div key={field} className="flex-1">
                                                    <input
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
                                    <div className="space-y-3 pt-3 border-t border-gray-200">
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

                <div className="p-3 sm:p-4 border-t bg-gray-50 dark:bg-gray-700 rounded-b-lg space-y-3"> 
                    <div className="flex justify-between text-sm sm:text-base">
                        <span>Subtotal</span>
                        <span>৳{calculateTotal().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm sm:text-base">
                        <span>Discount</span>
                        <input
                            type="number"
                            className="w-20 sm:w-24 border dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded p-1 sm:p-2 text-right text-sm"
                            value={discount}
                            onChange={e => setDiscount(e.target.value)}
                        />
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="font-bold text-sm sm:text-base">Net Total</span>
                        <span className="font-bold text-lg sm:text-xl">৳{(calculateTotal() - discount).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm sm:text-base">
                        <span>Paid Amount</span>
                        <input
                            type="number"
                            className="w-20 sm:w-28 border dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded p-1 sm:p-2 text-right font-bold text-green-600 text-sm"
                            value={paidAmount}
                            onChange={e => setPaidAmount(e.target.value)}
                        />
                    </div>
                    <div className="flex justify-between items-center text-sm sm:text-base">
                        <span>Due</span>
                        <span className="text-red-600 font-bold">৳{(calculateTotal() - discount - paidAmount).toFixed(2)}</span>
                    </div>

                    <select
                        className="w-full border dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 p-2 sm:p-3 rounded text-sm sm:text-base"
                        value={paymentMethod}
                        onChange={e => setPaymentMethod(e.target.value)}
                    >
                        <option value="Cash">Cash</option>
                        <option value="Card">Card</option>
                        <option value="MFS">Mobile Banking (Bkash/Nagad)</option>
                    </select>

                    <textarea
                        className="w-full border dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 p-2 sm:p-3 rounded text-xs sm:text-sm"
                        placeholder="Add a note..."
                        rows="2"
                        value={note}
                        onChange={e => setNote(e.target.value)}
                    />

                    <div className="grid grid-cols-2 gap-2">
                        <button onClick={handleHold} className="bg-yellow-500 text-white py-2 sm:py-3 rounded-lg font-bold hover:bg-yellow-600 flex justify-center items-center text-xs sm:text-sm touch-manipulation">
                            <PauseCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" /> Hold
                        </button>
                        <button onClick={() => setShowHeldModal(true)} className="bg-purple-600 text-white py-2 sm:py-3 rounded-lg font-bold hover:bg-purple-700 flex justify-center items-center text-xs sm:text-sm touch-manipulation">
                            <PlayCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" /> Recall ({heldTransactions.length})
                        </button>
                    </div>

                    <button onClick={handleCheckout} className="w-full bg-blue-600 text-white py-3 sm:py-4 rounded-lg font-bold hover:bg-blue-700 flex justify-center items-center text-sm sm:text-base touch-manipulation">
                        <Printer className="w-4 h-4 sm:w-5 sm:h-5 mr-2" /> Complete & Print
                    </button>
                </div>
            </div>

            {/* Held Transactions Modal */}
            {showHeldModal && (
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
            )}
        </div>
    );
}
    const NO_IMAGE_PLACEHOLDER = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='150' height='150'><rect width='100%' height='100%' fill='%23f3f4f6'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-size='14'>No Image</text></svg>";
