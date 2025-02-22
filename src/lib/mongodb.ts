const MONGODB_DATA_API_URL = 'https://data.mongodb-api.com/app/data-api/endpoint/data/v1/action';
const API_KEY = 'your_data_api_key'; // You'll need to get this from MongoDB Atlas

export async function mongoDBRequest(action: string, data: any) {
  const response = await fetch(`${MONGODB_DATA_API_URL}/${action}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': API_KEY,
    },
    body: JSON.stringify({
      dataSource: 'Cluster0',
      database: '3d-marketplace',
      collection: data.collection,
      ...data,
    }),
  });

  if (!response.ok) {
    throw new Error('MongoDB request failed');
  }

  return response.json();
}

export async function uploadFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}

// Simple hash function for password (not for production use)
export function hashPassword(password: string): string {
  return btoa(password); // Base64 encoding for demo purposes
}

export function generateToken(userId: string, role: string): string {
  const payload = {
    userId,
    role,
    exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hour expiration
  };
  return btoa(JSON.stringify(payload));
}