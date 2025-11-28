import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { navigationItems } from '../config/navigation';

export default function Layout() {
    const { user, logout, hasPermission } = useAuth();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const closeMobileMenu = () => {
        setIsMobileMenuOpen(false);
    };

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Mobile Header */}
            <div className="lg:hidden fixed top-0 left-0 right-0 bg-white shadow-md z-40 flex items-center justify-between p-4">
                <h1 className="text-lg font-bold text-blue-600">Minar Optics</h1>
                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                >
                    {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>

            {/* Sidebar - Desktop: Always visible, Mobile: Drawer overlay */}
            <div className={`
                fixed lg:static inset-y-0 left-0 z-50
                w-64 bg-white shadow-md
                transform transition-transform duration-300 ease-in-out
                ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                <div className="p-4 border-b mt-16 lg:mt-0">
                    <h1 className="text-xl font-bold text-blue-600 hidden lg:block">Minar Optics</h1>
                    <p className="text-sm text-gray-500">Welcome, {user?.name}</p>
                </div>
                <nav className="p-4 space-y-2 overflow-y-auto h-[calc(100vh-120px)]">
                    {navigationItems.map((item) => (
                        hasPermission(item.permission) && (
                            <Link
                                key={item.id}
                                to={item.path}
                                className="flex items-center p-3 text-gray-700 hover:bg-blue-50 rounded transition-colors"
                                onClick={closeMobileMenu}
                            >
                                <item.icon className="w-5 h-5 mr-3" />
                                {item.title}
                            </Link>
                        )
                    ))}
                    <button
                        onClick={() => { handleLogout(); closeMobileMenu(); }}
                        className="w-full flex items-center p-3 text-red-600 hover:bg-red-50 rounded mt-8 transition-colors"
                    >
                        <LogOut className="w-5 h-5 mr-3" />
                        Logout
                    </button>
                </nav>
            </div>

            {/* Mobile Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                    onClick={closeMobileMenu}
                />
            )}

            {/* Main Content */}
            <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8 mt-16 lg:mt-0">
                <Outlet />
            </div>
        </div>
    );
}
