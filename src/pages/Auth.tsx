import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { LogIn, UserPlus, Lock, Mail, User, ArrowRight, Loader2 } from 'lucide-react';
import styles from './Auth.module.css';

interface AuthError {
  message: string;
}

const Auth = () => {
  const navigate = useNavigate();
  const { signIn: login, signUp: register } = useAuthStore();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(formData.email, formData.password);
      } else {
        await register(formData.username, formData.email, formData.password);
      }
      navigate('/marketplace');
    } catch (err) {
      const error = err as AuthError;
      setError(error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="relative">
        {/* Background Effects */}
        <div className={`absolute top-0 right-0 w-[600px] h-[600px] bg-[#6F5AFA] rounded-full mix-blend-multiply filter blur-[128px] opacity-5 ${styles.background_blob}`}></div>
        <div className={`absolute bottom-0 left-0 w-[600px] h-[600px] bg-[#FF6B6B] rounded-full mix-blend-multiply filter blur-[128px] opacity-5 ${styles.background_blob}`}></div>
        
        {/* Auth Container */}
        <div className={`w-full max-w-md relative ${styles.form_container}`}>
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-[#6F5AFA] via-[#FF6B6B] to-[#4ECDC4] text-transparent bg-clip-text">
              Welcome to Renderbay
            </h2>
            <p className="mt-2 text-gray-600">
              {isLogin ? 'Sign in to your account' : 'Create your account'}
            </p>
          </div>

          {/* Form */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-white/20 hover:shadow-[0_20px_60px_-15px_rgba(111,90,250,0.3)] transition-all duration-500">
            <form onSubmit={handleSubmit} className="space-y-6">
              {!isLogin && (
                <div className={styles.input_field}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className="pl-10 w-full px-4 py-3 bg-white/80 backdrop-blur-xl border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#6F5AFA] transition-all duration-300"
                      placeholder="Enter your username"
                      required
                    />
                  </div>
                </div>
              )}

              <div className={styles.input_field}>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="pl-10 w-full px-4 py-3 bg-white/80 backdrop-blur-xl border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#6F5AFA] transition-all duration-300"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              <div className={styles.input_field}>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="pl-10 w-full px-4 py-3 bg-white/80 backdrop-blur-xl border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#6F5AFA] transition-all duration-300"
                    placeholder="Enter your password"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="text-[#FF6B6B] text-sm bg-[#FF6B6B]/10 p-3 rounded-xl">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className={`group w-full flex items-center justify-center px-6 py-3 bg-gradient-to-r from-[#6F5AFA] via-[#FF6B6B] to-[#4ECDC4] text-white rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-[#6F5AFA]/20 transform hover:-translate-y-0.5 relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed ${styles.submit_button}`}
              >
                <span className="relative z-10 flex items-center gap-2">
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      {isLogin ? <LogIn className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
                      {isLogin ? 'Sign In' : 'Create Account'}
                      <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-[#4ECDC4] via-[#FF6B6B] to-[#6F5AFA] opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-[#6F5AFA] hover:text-[#FF6B6B] transition-colors duration-300"
              >
                {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;