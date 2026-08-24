import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import Navbar from './components/Navbar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Feed from './pages/Feed.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import PostDetail from './pages/PostDetail.jsx';
import CreatePost from './pages/CreatePost.jsx';
import EditPost from './pages/EditPost.jsx';
import MyPosts from './pages/MyPosts.jsx';
import NotFound from './pages/NotFound.jsx';

function GuestOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/" replace /> : children;
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function Footer() {
  return (
    <footer className="footer">
      <div className="footer__inner">
        <span>© {new Date().getFullYear()} Inkwell</span>
        <span>React · Express · Neon Postgres · Redis</span>
      </div>
    </footer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ScrollToTop />
      <Navbar />

      <main>
        <div className="container">
          <Routes>
            <Route path="/" element={<Feed />} />
            <Route path="/post/:id" element={<PostDetail />} />

            <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
            <Route path="/register" element={<GuestOnly><Register /></GuestOnly>} />

            <Route path="/new" element={<ProtectedRoute><CreatePost /></ProtectedRoute>} />
            <Route path="/post/:id/edit" element={<ProtectedRoute><EditPost /></ProtectedRoute>} />
            <Route path="/me" element={<ProtectedRoute><MyPosts /></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </main>

      <Footer />
    </AuthProvider>
  );
}
