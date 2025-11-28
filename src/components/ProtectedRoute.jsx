import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, permission }) {
    const { user, loading, hasPermission } = useAuth();

    if (loading) return <div>Loading...</div>;

    if (!user) {
        return <Navigate to="/login" />;
    }

    if (permission && !hasPermission(permission)) {
        return <Navigate to="/" />;
    }

    return children;
}
