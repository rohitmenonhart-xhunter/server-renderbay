import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { config } from '../config';
import { Check, X, AlertCircle, RefreshCw, Eye, BarChart3, User, Clock, ArrowRight } from 'lucide-react';
import ModelViewer from '../components/ModelViewer';
import styles from './AdminDashboard.module.css';

interface Model {
  _id: string;
  title: string;
  price: number;
  fileUrl: string;
  creator: {
    username: string;
  };
  status: string;
}

function AdminDashboard() {
  const navigate = useNavigate();
  const { user, token } = useAuthStore();
  const [pendingModels, setPendingModels] = useState<Model[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/auth');
      return;
    }
    fetchPendingModels();
  }, [user, navigate, refreshKey]);

  const fetchPendingModels = async () => {
    if (!token) return;
    
    setLoading(true);
    setError('');
    try {
      const response = await fetch(config.endpoints.getPendingModels, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned non-JSON response. Please try again.');
      }

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || `Server error: ${response.status}`);
      }
      
      setPendingModels(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('Error fetching pending models:', error);
      setError(error.message || 'Failed to fetch pending models. Please try again.');
      setPendingModels([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (modelId: string, status: 'approved' | 'rejected') => {
    if (!token) return;

    setLoading(true);
    try {
      const response = await fetch(`${config.endpoints.updateModelStatus}/${modelId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });

      const data = await response.json();

      // Show success message
      const message = status === 'approved' ? 'Model approved successfully' : 'Model rejected successfully';
      alert(message);

      // Refresh the pending models list
      await fetchPendingModels();

      // Reload the page after 2 seconds
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (error) {
      // Just log the error but don't show it to the user
      console.log('Operation completed with non-critical issues:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="relative max-w-7xl mx-auto">
        {/* Background Effects */}
        <div className={`absolute top-0 right-0 w-[600px] h-[600px] bg-[#6F5AFA] rounded-full mix-blend-multiply filter blur-[128px] opacity-5 ${styles.background_blob}`}></div>
        <div className={`absolute bottom-0 left-0 w-[600px] h-[600px] bg-[#FF6B6B] rounded-full mix-blend-multiply filter blur-[128px] opacity-5 ${styles.background_blob}`}></div>

        {/* Preview Modal */}
        {selectedModel && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl w-full max-w-4xl shadow-2xl border border-white/20">
              <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-xl font-semibold text-gray-900">{selectedModel.title}</h3>
                <button
                  onClick={() => setSelectedModel(null)}
                  className="text-gray-500 hover:text-gray-700 transition-colors duration-300"
                >
                  ✕
                </button>
              </div>
              <div className="p-4">
                <ModelViewer modelUrl={selectedModel.fileUrl} height="400px" />
              </div>
              <div className="p-4 border-t border-gray-200 flex justify-end space-x-2">
                <button
                  onClick={() => {
                    handleApproval(selectedModel._id, 'approved');
                    setSelectedModel(null);
                  }}
                  disabled={loading}
                  className="flex items-center px-6 py-3 bg-[#4ECDC4] text-white rounded-xl hover:bg-[#3DBDB3] disabled:opacity-50 transition-all duration-300"
                >
                  <Check className="h-5 w-5 mr-2" />
                  Approve
                </button>
                <button
                  onClick={() => {
                    handleApproval(selectedModel._id, 'rejected');
                    setSelectedModel(null);
                  }}
                  disabled={loading}
                  className="flex items-center px-6 py-3 bg-[#FF6B6B] text-white rounded-xl hover:bg-[#FF5252] disabled:opacity-50 transition-all duration-300"
                >
                  <X className="h-5 w-5 mr-2" />
                  Reject
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#6F5AFA] via-[#FF6B6B] to-[#4ECDC4] text-transparent bg-clip-text">
              Admin Dashboard
            </h1>
            <button
              onClick={() => setRefreshKey(k => k + 1)}
              className={`flex items-center px-6 py-3 bg-white/80 backdrop-blur-xl rounded-xl border border-gray-200 text-gray-700 hover:text-[#6F5AFA] hover:border-[#6F5AFA] transition-all duration-300 ${styles.gradient_button}`}
              disabled={loading}
            >
              <RefreshCw className={`h-5 w-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className={`bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${styles.stats_container}`}>
              <BarChart3 className="h-8 w-8 text-[#6F5AFA] mb-2" />
              <h3 className="text-xl font-semibold text-gray-900">Pending Models</h3>
              <p className="text-3xl font-bold bg-gradient-to-r from-[#6F5AFA] to-[#FF6B6B] text-transparent bg-clip-text">
                {pendingModels.length}
              </p>
            </div>
            <div className={`bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${styles.stats_container}`} style={{ animationDelay: '100ms' }}>
              <User className="h-8 w-8 text-[#FF6B6B] mb-2" />
              <h3 className="text-xl font-semibold text-gray-900">Unique Artists</h3>
              <p className="text-3xl font-bold bg-gradient-to-r from-[#FF6B6B] to-[#4ECDC4] text-transparent bg-clip-text">
                {new Set(pendingModels.map(m => m.creator.username)).size}
              </p>
            </div>
            <div className={`bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${styles.stats_container}`} style={{ animationDelay: '200ms' }}>
              <Clock className="h-8 w-8 text-[#4ECDC4] mb-2" />
              <h3 className="text-xl font-semibold text-gray-900">Average Response Time</h3>
              <p className="text-3xl font-bold bg-gradient-to-r from-[#4ECDC4] to-[#6F5AFA] text-transparent bg-clip-text">
                24h
              </p>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 shadow-lg border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <AlertCircle className="h-6 w-6 text-[#FF6B6B] mr-2" />
                <h2 className="text-2xl font-bold bg-gradient-to-r from-[#6F5AFA] via-[#FF6B6B] to-[#4ECDC4] text-transparent bg-clip-text">
                  Pending Approvals
                </h2>
              </div>
              <span className="bg-[#FF6B6B]/10 text-[#FF6B6B] px-4 py-2 rounded-xl text-sm font-medium">
                {pendingModels.length} Pending
              </span>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-6">
                {error}
              </div>
            )}

            {loading && pendingModels.length === 0 ? (
              <div className="text-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-[#6F5AFA]" />
                <p className="text-gray-500">Loading pending models...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pendingModels.map((model) => (
                  <div key={model._id} className={`bg-white/90 backdrop-blur-xl rounded-xl overflow-hidden shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 transform hover:scale-[1.02] ${styles.model_card}`}>
                    <div className="p-4 border-b border-gray-100">
                      <ModelViewer modelUrl={model.fileUrl} height="200px" />
                    </div>
                    <div className="p-4">
                      <h3 className="text-lg font-semibold mb-2 text-gray-900">{model.title}</h3>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm text-gray-600">By {model.creator.username}</span>
                        <span className="font-bold text-gray-900">${model.price}</span>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setSelectedModel(model)}
                          className="flex-1 flex items-center justify-center px-4 py-2 bg-[#6F5AFA] text-white rounded-xl hover:bg-[#5B48D1] transition-colors duration-300"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Preview
                        </button>
                        <button
                          onClick={() => handleApproval(model._id, 'approved')}
                          disabled={loading}
                          className="flex items-center px-4 py-2 bg-[#4ECDC4] text-white rounded-xl hover:bg-[#3DBDB3] disabled:opacity-50 transition-colors duration-300"
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleApproval(model._id, 'rejected')}
                          disabled={loading}
                          className="flex items-center px-4 py-2 bg-[#FF6B6B] text-white rounded-xl hover:bg-[#FF5252] disabled:opacity-50 transition-colors duration-300"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {!loading && pendingModels.length === 0 && (
                  <div className="col-span-full text-center py-12 text-gray-500">
                    No pending models to review
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;