import React, { useState, useRef, useEffect } from 'react';
import { Upload, Package, DollarSign, Eye, Trash2, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { config } from '../config';
import ModelViewer from '../components/ModelViewer';
import styles from './ArtistDashboard.module.css';

interface Model {
  _id: string;
  title: string;
  description: string;
  price: number;
  fileUrl: string;
  status: string;
  purchases: Array<{
    buyer: {
      username: string;
    };
    purchaseDate: string;
  }>;
}

interface Notification {
  _id: string;
  message: string;
  modelTitle: string;
  type: 'rejection' | 'approval';
  createdAt: string;
}

function ArtistDashboard() {
  const navigate = useNavigate();
  const { user, token } = useAuthStore();
  const [models, setModels] = useState<Model[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [modelData, setModelData] = useState({
    title: '',
    description: '',
    price: '',
  });
  const [error, setError] = useState('');
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [previewFile, setPreviewFile] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (!user || !token) {
      navigate('/auth');
      return;
    }
    fetchModels();
    fetchNotifications();
  }, [user, token, navigate]);

  const fetchModels = async () => {
    try {
      const response = await fetch(config.endpoints.getModels(user?.id || ''), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        setModels(data);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Error fetching models:', error);
      setError('Failed to fetch models');
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await fetch(config.endpoints.notifications, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        setNotifications(data);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const clearNotifications = async () => {
    try {
      const response = await fetch(config.endpoints.clearNotifications, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        setNotifications([]);
        setShowNotifications(false);
      }
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (200MB limit)
      const maxSize = 200 * 1024 * 1024; // 200MB in bytes
      if (file.size > maxSize) {
        setError(`File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds the maximum limit of 200MB`);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      // Show warning for large files
      if (file.size > 50 * 1024 * 1024) { // 50MB
        setError(`Warning: Large file (${(file.size / (1024 * 1024)).toFixed(1)}MB). Upload may take several minutes.`);
      } else {
        setError('');
      }

      // Create a temporary URL for the selected file
      const fileUrl = URL.createObjectURL(file);
      setPreviewFile(fileUrl);
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileInputRef.current?.files?.[0]) {
      setError('Please select a file to upload');
      return;
    }

    const file = fileInputRef.current.files[0];
    if (!file.name.toLowerCase().endsWith('.stl')) {
      setError('Only .stl files are allowed');
      return;
    }

    // Double check file size
    const maxSize = 300 * 1024 * 1024; // 300MB in bytes
    if (file.size > maxSize) {
      setError(`File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds the maximum limit of 300MB`);
      return;
    }

    setUploading(true);
    setError('');
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', modelData.title);
      formData.append('description', modelData.description);
      formData.append('price', modelData.price);

      const xhr = new XMLHttpRequest();
      
      // Set timeout to 30 minutes
      xhr.timeout = 30 * 60 * 1000;
      
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(progress);
        }
      };

      const response = await new Promise((resolve, reject) => {
        xhr.open('POST', config.endpoints.upload);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              resolve(response);
            } catch (e) {
              reject(new Error('Invalid JSON response from server'));
            }
          } else {
            try {
              const errorResponse = JSON.parse(xhr.responseText);
              reject(new Error(errorResponse.message || errorResponse.error || 'Upload failed'));
            } catch (e) {
              reject(new Error(`Upload failed with status ${xhr.status}. Please try again.`));
            }
          }
        };
        
        xhr.onerror = () => reject(new Error('Network error occurred. Please check your connection and try again.'));
        xhr.ontimeout = () => reject(new Error('Upload timed out. Please try again.'));
        xhr.onabort = () => reject(new Error('Upload was aborted. Please try again.'));
        
        xhr.send(formData);
      });

      await fetchModels();
      setModelData({ title: '', description: '', price: '' });
      if (fileInputRef.current) fileInputRef.current.value = '';
      setPreviewFile(null);
      setUploadProgress(0);
      setError(''); // Clear any existing errors
    } catch (error: any) {
      console.error('Upload error:', error);
      setError(error.message || 'Failed to upload file. Please try again.');
      // If the upload failed, we should reset the form
      if (fileInputRef.current) fileInputRef.current.value = '';
      setPreviewFile(null);
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteModel = async (modelId: string) => {
    if (!token) return;
    
    if (!window.confirm('Are you sure you want to delete this model? This action cannot be undone.')) {
      return;
    }

    try {
      setError(''); // Clear any existing errors
      console.log('Attempting to delete model:', modelId);
      
      const response = await fetch(config.endpoints.deleteModel(modelId), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      console.log('Delete response status:', response.status);
      const data = await response.json();
      console.log('Delete response data:', data);

      if (!response.ok) {
        throw new Error(data.message || `Failed to delete model: ${response.status}`);
      }

      // If there's a warning but the operation was successful, log it
      if (data.warning) {
        console.log('Warning:', data.warning);
      }

      // Remove the model from the local state
      setModels(models.filter(model => model._id !== modelId));
      
      // Close the preview if the deleted model was being previewed
      if (selectedModel?._id === modelId) {
        setSelectedModel(null);
      }
    } catch (error: any) {
      console.error('Error deleting model:', error);
      setError(error.message || 'Failed to delete model. Please try again.');
    }
  };

  if (!user || !token) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="relative max-w-7xl mx-auto">
        {/* Background Effects */}
        <div className={`absolute top-0 right-0 w-[600px] h-[600px] bg-[#6F5AFA] rounded-full mix-blend-multiply filter blur-[128px] opacity-5 ${styles.background_blob}`}></div>
        <div className={`absolute bottom-0 left-0 w-[600px] h-[600px] bg-[#FF6B6B] rounded-full mix-blend-multiply filter blur-[128px] opacity-5 ${styles.background_blob}`}></div>
        
        {/* Notifications Panel */}
        {notifications.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="text-gray-700 hover:text-[#6F5AFA] flex items-center transition-colors duration-300"
              >
                <span className="mr-2">
                  {showNotifications ? 'Hide' : 'Show'} Notifications
                </span>
                <span className="bg-[#6F5AFA] text-white rounded-full px-2 py-1 text-xs">
                  {notifications.length}
                </span>
              </button>
              {showNotifications && (
                <button
                  onClick={clearNotifications}
                  className="text-gray-500 hover:text-gray-700 text-sm transition-colors duration-300"
                >
                  Clear all
                </button>
              )}
            </div>
            
            {showNotifications && (
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-4 space-y-3 shadow-lg border border-white/20">
                {notifications.map((notification, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-xl ${
                      notification.type === 'rejection'
                        ? 'bg-red-500/10 border border-red-500/20'
                        : 'bg-green-500/10 border border-green-500/20'
                    } transition-all duration-300 hover:transform hover:scale-[1.02]`}
                  >
                    <p className={`text-sm ${
                      notification.type === 'rejection' ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(notification.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

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
                <div className="mt-4">
                  <h4 className="font-semibold mb-2 text-gray-900">Purchase History</h4>
                  {selectedModel.purchases.length > 0 ? (
                    <ul className="space-y-2">
                      {selectedModel.purchases.map((purchase, index) => (
                        <li key={index} className="text-sm text-gray-600">
                          Purchased by {purchase.buyer.username} on {new Date(purchase.purchaseDate).toLocaleDateString()}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500">No purchases yet</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-[#6F5AFA] via-[#FF6B6B] to-[#4ECDC4] text-transparent bg-clip-text">
            Artist Dashboard
          </h1>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className={`bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${styles.form_container}`}>
              <Package className="h-8 w-8 text-[#6F5AFA] mb-2" />
              <h3 className="text-xl font-semibold text-gray-900">Total Models</h3>
              <p className="text-3xl font-bold bg-gradient-to-r from-[#6F5AFA] to-[#FF6B6B] text-transparent bg-clip-text">
                {models.length}
              </p>
            </div>
            <div className={`bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${styles.form_container}`} style={{ animationDelay: '100ms' }}>
              <DollarSign className="h-8 w-8 text-[#4ECDC4] mb-2" />
              <h3 className="text-xl font-semibold text-gray-900">Total Sales</h3>
              <p className="text-3xl font-bold bg-gradient-to-r from-[#4ECDC4] to-[#6F5AFA] text-transparent bg-clip-text">
                {models.reduce((sum, model) => sum + model.purchases.length, 0)}
              </p>
            </div>
            <div className={`bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${styles.form_container}`} style={{ animationDelay: '200ms' }}>
              <Upload className="h-8 w-8 text-[#FF6B6B] mb-2" />
              <form onSubmit={handleFileUpload} className="space-y-4">
                {error && (
                  <div className="text-red-500 text-sm bg-red-50 p-3 rounded-xl">{error}</div>
                )}
                <input
                  type="text"
                  placeholder="Model Title"
                  className="w-full px-4 py-3 bg-white/80 backdrop-blur-xl border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#6F5AFA] transition-all duration-300"
                  value={modelData.title}
                  onChange={(e) => setModelData({ ...modelData, title: e.target.value })}
                  required
                />
                <input
                  type="text"
                  placeholder="Description"
                  className="w-full px-4 py-3 bg-white/80 backdrop-blur-xl border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#6F5AFA] transition-all duration-300"
                  value={modelData.description}
                  onChange={(e) => setModelData({ ...modelData, description: e.target.value })}
                />
                <input
                  type="number"
                  placeholder="Price"
                  className="w-full px-4 py-3 bg-white/80 backdrop-blur-xl border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#6F5AFA] transition-all duration-300"
                  value={modelData.price}
                  onChange={(e) => setModelData({ ...modelData, price: e.target.value })}
                  required
                  min="0"
                  step="0.01"
                />
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".stl"
                  className="w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-[#6F5AFA] file:text-white hover:file:bg-[#5B48D1] file:transition-colors file:duration-300"
                  onChange={handleFileChange}
                  required
                />
                {previewFile && (
                  <div className="mt-4 border border-gray-200 rounded-xl overflow-hidden">
                    <ModelViewer modelUrl={previewFile} height="200px" isPreview={true} />
                  </div>
                )}
                <button
                  type="submit"
                  disabled={uploading}
                  className={`w-full bg-gradient-to-r from-[#6F5AFA] via-[#FF6B6B] to-[#4ECDC4] text-white px-6 py-3 rounded-xl hover:shadow-lg hover:shadow-[#6F5AFA]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:-translate-y-0.5 relative overflow-hidden group ${styles.gradient_button}`}
                >
                  {uploading ? (
                    <div className="flex items-center justify-center">
                      <span className="mr-2">Uploading... {uploadProgress}%</span>
                      <div className="w-full bg-white/20 rounded-full h-2 mt-1">
                        <div 
                          className="bg-white rounded-full h-2 transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      Upload Model
                      <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 shadow-lg border border-white/20">
          <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-[#6F5AFA] via-[#FF6B6B] to-[#4ECDC4] text-transparent bg-clip-text">
            Your Models
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {models.map((model) => (
              <div key={model._id} className={`bg-white/90 backdrop-blur-xl rounded-xl overflow-hidden shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 transform hover:scale-[1.02] ${styles.model_card}`}>
                <div className="p-4 border-b border-gray-100">
                  <ModelViewer modelUrl={model.fileUrl} height="200px" />
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold mb-2 text-gray-900">{model.title}</h3>
                  <p className="text-sm text-gray-600 mb-4">{model.description}</p>
                  <div className="flex items-center justify-between mb-4">
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      model.status === 'approved' 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-yellow-100 text-yellow-600'
                    }`}>
                      {model.status}
                    </span>
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
                    <a
                      href={config.endpoints.getModelFile(model.fileUrl)}
                      className="flex items-center justify-center px-4 py-2 bg-[#4ECDC4] text-white rounded-xl hover:bg-[#3DBDB3] transition-colors duration-300"
                      download
                    >
                      <Package className="h-4 w-4" />
                    </a>
                    <button
                      onClick={() => handleDeleteModel(model._id)}
                      className="flex items-center justify-center px-4 py-2 bg-[#FF6B6B] text-white rounded-xl hover:bg-[#FF5252] transition-colors duration-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {models.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-500">
                No models uploaded yet
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ArtistDashboard;