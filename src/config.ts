const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const config = {
  apiUrl: API_BASE_URL,
  endpoints: {
    signIn: `${API_BASE_URL}/api/auth/signin`,
    signUp: `${API_BASE_URL}/api/auth/signup`,
    upload: `${API_BASE_URL}/api/upload`,
    getModels: (creatorId: string) => `${API_BASE_URL}/api/models/creator/${creatorId}`,
    getModelFile: (fileUrl: string) => `${API_BASE_URL}${fileUrl}`,
    getPendingModels: `${API_BASE_URL}/api/models/pending`,
    updateModelStatus: `${API_BASE_URL}/api/models/status`,
    getAllModels: `${API_BASE_URL}/api/models`,
    purchaseModel: (modelId: string) => `${API_BASE_URL}/api/models/${modelId}/purchase`,
    deleteModel: (modelId: string) => `${API_BASE_URL}/api/models/${modelId}`,
    notifications: `${API_BASE_URL}/api/notifications`,
    clearNotifications: `${API_BASE_URL}/api/notifications/clear`
  }
}; 