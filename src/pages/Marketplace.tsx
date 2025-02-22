import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { config } from '../config';
import { Search, ShoppingCart, Download, Eye, X, SlidersHorizontal, Loader2, ArrowUpDown, Flame, Clock, TrendingUp, BarChart3, Waves, User } from 'lucide-react';
import ModelViewer from '../components/ModelViewer';
import styles from './Marketplace.module.css';

interface Model {
  _id: string;
  title: string;
  description: string;
  price: number;
  fileUrl: string;
  creator: {
    username: string;
  };
  status: string;
  purchased?: boolean;
}

type SortOption = 'price-asc' | 'price-desc' | 'newest' | 'oldest';
type CategoryTab = 'trending' | 'top' | 'new' | 'all';

function Marketplace() {
  const { user, token } = useAuthStore();
  const [models, setModels] = useState<Model[]>([]);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [purchaseLoading, setPurchaseLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<CategoryTab>('trending');

  const getGreeting = () => {
    const hour = new Date().getHours();
    let greeting = "";
    if (hour >= 5 && hour < 12) greeting = "Good Morning";
    else if (hour >= 12 && hour < 17) greeting = "Good Afternoon";
    else if (hour >= 17 && hour < 22) greeting = "Good Evening";
    else greeting = "Good Night";

    if (user?.username) {
      return `${greeting}, ${user.username}`;
    }
    return greeting;
  };

  useEffect(() => {
    fetchModels();
  }, []);

  const fetchModels = async () => {
    try {
      setLoading(true);
      const response = await fetch(config.endpoints.getAllModels);
      const data = await response.json();
      if (response.ok) {
        setModels(data.filter((model: Model) => model.status === 'approved'));
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Error fetching models:', error);
      setError('Failed to fetch models');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (modelId: string) => {
    if (!user || !token) {
      setError('Please sign in to purchase models');
      return;
    }

    setPurchaseLoading(modelId);
    try {
      const response = await fetch(config.endpoints.purchaseModel(modelId), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (response.ok) {
        alert('Purchase successful! You can now download the model.');
        await fetchModels();
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Purchase error:', error);
      setError('Failed to purchase model');
    } finally {
      setPurchaseLoading(null);
    }
  };

  const trendingModels = models.slice(0, 1);
  const topModels = models.slice(0, 8);

  const filteredAndSortedModels = (activeTab === 'top' ? topModels : models)
    .filter((model: Model) => {
      const matchesSearch = 
        model.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        model.creator.username.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesPrice = 
        (!priceRange.min || model.price >= parseFloat(priceRange.min)) &&
        (!priceRange.max || model.price <= parseFloat(priceRange.max));

      return matchesSearch && matchesPrice;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-asc':
          return a.price - b.price;
        case 'price-desc':
          return b.price - a.price;
        case 'newest':
          return new Date(b._id).getTime() - new Date(a._id).getTime();
        case 'oldest':
          return new Date(a._id).getTime() - new Date(b._id).getTime();
        default:
          return 0;
      }
    });

  const renderHeroModel = (model: Model) => (
    <div className="relative group cursor-pointer" onClick={() => setSelectedModel(model)}>
      <div className="aspect-square rounded-xl overflow-hidden">
        <ModelViewer modelUrl={model.fileUrl} height="100%" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
        <div>
          <h3 className="text-2xl font-bold text-white mb-2">{model.title}</h3>
          <p className="text-gray-200">By {model.creator.username}</p>
          <p className="text-purple-400 font-bold text-xl mt-2">${model.price}</p>
        </div>
      </div>
    </div>
  );

  const renderModelCard = (model: Model) => (
    <div
      key={model._id}
      className="bg-gray-800 rounded-xl overflow-hidden hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300"
    >
      <div className="aspect-square relative group cursor-pointer" onClick={() => setSelectedModel(model)}>
        <ModelViewer modelUrl={model.fileUrl} height="100%" />
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <Eye className="h-8 w-8 text-white" />
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="font-semibold text-white">{model.title}</h3>
            <p className="text-sm text-gray-400">By {model.creator.username}</p>
          </div>
          <span className="text-lg font-bold text-purple-400">${model.price}</span>
        </div>
        <div className="flex gap-2 mt-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePurchase(model._id);
            }}
            disabled={purchaseLoading === model._id}
            className="flex-1 flex items-center justify-center px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {purchaseLoading === model._id ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <ShoppingCart className="h-5 w-5 mr-2" />
                Purchase
              </>
            )}
          </button>
          {model.purchased && (
            <a
              href={config.endpoints.getModelFile(model.fileUrl)}
              className="flex items-center justify-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              download
              onClick={(e) => e.stopPropagation()}
            >
              <Download className="h-5 w-5" />
            </a>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-[#6F5AFA]/5 to-[#FF6B6B]/5 opacity-80"></div>
          <div className="absolute top-0 left-0 w-full h-full bg-[url('/grid.svg')] opacity-5 animate-pulse"></div>
        </div>
        <div className="relative max-w-[1504px] mx-auto px-4 sm:px-6 lg:px-8 py-32">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#6F5AFA] rounded-full mix-blend-multiply filter blur-[128px] opacity-5 animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[#FF6B6B] rounded-full mix-blend-multiply filter blur-[128px] opacity-5 animate-pulse animation-delay-2000"></div>
          
          <div className="text-center mb-16 transform hover:scale-[1.01] transition-all duration-500">
            <div className="flex items-center justify-center mb-6 flex-col">
              <Waves className="h-12 w-12 text-[#6F5AFA] mb-4 animate-bounce" />
              <div className="flex flex-col items-center gap-2">
                <h2 className={`text-2xl font-medium bg-gradient-to-r from-[#6F5AFA] to-[#FF6B6B] text-transparent bg-clip-text ${styles.animate_fade_in} ${styles.animation_delay_300}`}>
                  {getGreeting()}
                </h2>
                <h1 className={`text-7xl font-bold bg-gradient-to-r from-[#6F5AFA] via-[#FF6B6B] to-[#4ECDC4] text-transparent bg-clip-text bg-animate font-['Inter'] tracking-tight ${styles.animate_fade_in} ${styles.animation_delay_500}`}>
                  Renderbay
                </h1>
              </div>
            </div>
            <p className={`text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed font-light mt-6 ${styles.animate_fade_in} ${styles.animation_delay_700}`}>
              Discover and collect extraordinary 3D models in the world's most innovative digital marketplace
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20 hover:shadow-[0_20px_60px_-15px_rgba(111,90,250,0.3)] transition-all duration-500 transform hover:-translate-y-1">
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="h-2 w-2 bg-[#6F5AFA] rounded-full animate-ping"></div>
                  <p className="text-[#6F5AFA] font-medium tracking-wide">Featured Collection</p>
                </div>
                <h2 className="text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 text-transparent bg-clip-text">
                  Premium 3D Models
                </h2>
                <p className="text-gray-600 leading-relaxed text-lg">
                  Explore our curated collection of high-quality 3D models, perfect for your next project
                </p>
                <div className="flex gap-4">
                  <button className="group px-8 py-4 bg-gradient-to-r from-[#6F5AFA] via-[#FF6B6B] to-[#4ECDC4] text-white rounded-xl transition-all duration-300 font-medium text-lg shadow-lg hover:shadow-[0_10px_30px_-10px_rgba(111,90,250,0.5)] transform hover:-translate-y-0.5 relative overflow-hidden">
                    <span className="relative z-10">Start Exploring</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-[#4ECDC4] via-[#FF6B6B] to-[#6F5AFA] opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  </button>
                  <button className="px-8 py-4 bg-white text-gray-900 border border-gray-200 rounded-xl hover:border-[#6F5AFA] transition-all duration-300 font-medium text-lg shadow-lg hover:shadow-[0_10px_30px_-10px_rgba(111,90,250,0.2)] transform hover:-translate-y-0.5">
                    Learn More
                  </button>
                </div>
              </div>
            </div>
            <div className="relative transform hover:scale-[1.02] transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-r from-[#6F5AFA]/10 via-[#FF6B6B]/10 to-[#4ECDC4]/10 rounded-3xl transform rotate-6 scale-105 backdrop-blur-xl"></div>
              {trendingModels.map(renderHeroModel)}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative max-w-[1504px] mx-auto px-4 sm:px-6 lg:px-8 py-24">
        {/* Category Tabs */}
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-8">
            {['trending', 'top', 'new'].map((tab) => (
              <button
                key={tab}
                className={`group flex items-center gap-2 relative px-6 py-3 rounded-xl transition-all duration-300 ${
                  activeTab === tab
                    ? 'bg-gradient-to-r from-[#6F5AFA]/10 via-[#FF6B6B]/10 to-[#4ECDC4]/10 text-gray-900 shadow-lg'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/80'
                }`}
                onClick={() => setActiveTab(tab as CategoryTab)}
              >
                {tab === 'trending' && <Flame className={`h-5 w-5 ${activeTab === tab ? 'text-[#FF6B6B]' : ''} group-hover:animate-bounce`} />}
                {tab === 'top' && <TrendingUp className={`h-5 w-5 ${activeTab === tab ? 'text-[#6F5AFA]' : ''} group-hover:animate-bounce`} />}
                {tab === 'new' && <Clock className={`h-5 w-5 ${activeTab === tab ? 'text-[#4ECDC4]' : ''} group-hover:animate-bounce`} />}
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                {activeTab === tab && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-[#6F5AFA] via-[#FF6B6B] to-[#4ECDC4] transform scale-x-100 transition-transform duration-300"></span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          {[
            { label: 'Models', value: models.length, icon: BarChart3, color: '#6F5AFA' },
            { label: 'Artists', value: new Set(models.map(m => m.creator.username)).size, icon: User, color: '#FF6B6B' },
            { label: 'Total Volume', value: `$${models.reduce((sum, m) => sum + m.price, 0).toLocaleString()}`, icon: TrendingUp, color: '#4ECDC4' },
            { label: 'Floor Price', value: `$${Math.min(...models.map(m => m.price)).toLocaleString()}`, icon: ArrowUpDown, color: '#6F5AFA' }
          ].map((stat, i) => (
            <div key={i} className="group bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg hover:shadow-xl border border-white/20 transition-all duration-300 hover:-translate-y-1 transform hover:scale-[1.02]">
              <div className="flex items-center gap-3 mb-4">
                <stat.icon style={{ color: stat.color }} className="h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
                <p className="text-gray-600 text-sm font-medium group-hover:text-gray-900 transition-colors duration-300">{stat.label}</p>
              </div>
              <p className="text-2xl font-bold bg-gradient-to-r from-[#6F5AFA] via-[#FF6B6B] to-[#4ECDC4] text-transparent bg-clip-text">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-4 mb-12">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-hover:text-[#6F5AFA] transition-colors duration-300" />
            <input
              type="text"
              placeholder="Search models or artists..."
              className="w-full pl-12 pr-4 py-4 bg-white/80 backdrop-blur-xl border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#6F5AFA] transition-all duration-300 shadow-sm group-hover:shadow-lg"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="p-4 bg-white/80 backdrop-blur-xl border border-gray-200 rounded-xl hover:border-[#6F5AFA] transition-all duration-300 shadow-sm hover:shadow-lg transform hover:scale-105"
          >
            <SlidersHorizontal className="h-5 w-5 text-gray-600 hover:text-[#6F5AFA] transition-colors duration-300" />
          </button>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="appearance-none bg-white/80 backdrop-blur-xl border border-gray-200 rounded-xl px-6 py-4 pr-12 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#6F5AFA] transition-all duration-300 shadow-sm hover:shadow-lg cursor-pointer transform hover:scale-105"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>
        </div>

        {/* Model Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="relative">
              <div className="h-16 w-16 rounded-full border-4 border-[#6F5AFA]/20 border-t-[#6F5AFA] animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-8 w-8 rounded-full border-4 border-[#FF6B6B]/20 border-t-[#FF6B6B] animate-spin-reverse"></div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredAndSortedModels.map((model) => (
              <div
                key={model._id}
                className="group bg-white/80 backdrop-blur-xl rounded-2xl overflow-hidden border border-white/20 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2"
              >
                <div className="aspect-square relative cursor-pointer" onClick={() => setSelectedModel(model)}>
                  <ModelViewer modelUrl={model.fileUrl} height="100%" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#6F5AFA]/60 via-[#FF6B6B]/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center">
                    <Eye className="h-8 w-8 text-white transform scale-0 group-hover:scale-100 transition-transform duration-500" />
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg group-hover:text-[#6F5AFA] transition-colors duration-300">{model.title}</h3>
                      <p className="text-sm text-gray-500">By {model.creator.username}</p>
                    </div>
                    <span className="text-lg font-bold bg-gradient-to-r from-[#6F5AFA] to-[#FF6B6B] text-transparent bg-clip-text">${model.price}</span>
                  </div>
                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePurchase(model._id);
                      }}
                      disabled={purchaseLoading === model._id}
                      className="flex-1 flex items-center justify-center px-4 py-3 bg-gradient-to-r from-[#6F5AFA] via-[#FF6B6B] to-[#4ECDC4] text-white rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:-translate-y-0.5 relative overflow-hidden group"
                    >
                      <span className="relative z-10">
                        {purchaseLoading === model._id ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <>
                            <ShoppingCart className="h-5 w-5 mr-2 inline-block" />
                            Purchase
                          </>
                        )}
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-[#4ECDC4] via-[#FF6B6B] to-[#6F5AFA] opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    </button>
                    {model.purchased && (
                      <a
                        href={config.endpoints.getModelFile(model.fileUrl)}
                        className="flex items-center justify-center px-4 py-3 bg-gray-100 text-gray-900 rounded-xl hover:bg-gray-200 transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-lg"
                        download
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Download className="h-5 w-5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredAndSortedModels.length === 0 && (
          <div className="text-center py-16 bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 transform hover:scale-[1.01] transition-all duration-300">
            <Search className="h-16 w-16 mx-auto mb-4 text-[#6F5AFA] opacity-50" />
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">No items found</h3>
            <p className="text-gray-600">Try adjusting your search or filters</p>
          </div>
        )}

        {/* Preview Modal */}
        {selectedModel && (
          <div className="fixed inset-0 bg-white/95 backdrop-blur-2xl flex items-center justify-center z-50 p-4">
            <div className={`bg-white/80 backdrop-blur-xl rounded-2xl w-full max-w-4xl border border-white/20 shadow-2xl transform transition-all duration-500 scale-95 opacity-0 ${styles.animate_in} hover:shadow-[0_20px_60px_-15px_rgba(111,90,250,0.3)]`}>
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-semibold bg-gradient-to-r from-[#6F5AFA] to-[#FF6B6B] text-transparent bg-clip-text">{selectedModel.title}</h3>
                  <p className="text-gray-600">By {selectedModel.creator.username}</p>
                </div>
                <button
                  onClick={() => setSelectedModel(null)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-all duration-300 transform hover:scale-110"
                >
                  <X className="h-6 w-6 text-gray-600" />
                </button>
              </div>
              <div className="p-8">
                <ModelViewer modelUrl={selectedModel.fileUrl} height="400px" />
                <div className="mt-8">
                  <p className="text-gray-600 mb-6 text-lg">{selectedModel.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-3xl font-bold bg-gradient-to-r from-[#6F5AFA] via-[#FF6B6B] to-[#4ECDC4] text-transparent bg-clip-text">
                      ${selectedModel.price}
                    </span>
                    <div className="flex gap-3">
                      <button
                        onClick={() => handlePurchase(selectedModel._id)}
                        disabled={purchaseLoading === selectedModel._id}
                        className="flex items-center px-8 py-4 bg-gradient-to-r from-[#6F5AFA] to-[#FF6B6B] text-white rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl"
                      >
                        {purchaseLoading === selectedModel._id ? (
                          <Loader2 className="h-6 w-6 animate-spin" />
                        ) : (
                          <>
                            <ShoppingCart className="h-6 w-6 mr-2" />
                            Purchase Now
                          </>
                        )}
                      </button>
                      {selectedModel.purchased && (
                        <a
                          href={config.endpoints.getModelFile(selectedModel.fileUrl)}
                          className="flex items-center px-8 py-4 bg-gray-100 text-gray-900 rounded-xl hover:bg-gray-200 transition-all duration-300"
                          download
                        >
                          <Download className="h-6 w-6 mr-2" />
                          Download
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Marketplace;