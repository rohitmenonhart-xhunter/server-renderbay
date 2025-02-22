import React, { useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { BufferGeometry } from 'three';
import { config } from '../config';

interface ModelViewerProps {
  modelUrl: string;
  width?: string;
  height?: string;
  isPreview?: boolean;
}

function Model({ url, onError, onLoad, isPreview }: { 
  url: string; 
  onError: (error: string) => void; 
  onLoad: () => void;
  isPreview?: boolean;
}) {
  const [geometry, setGeometry] = useState<BufferGeometry | null>(null);

  useEffect(() => {
    const loader = new STLLoader();
    const fullUrl = isPreview ? url : `${config.apiUrl}${url}`;
    console.log('Loading STL from:', fullUrl);

    const loadModel = async () => {
      try {
        let modelData: BufferGeometry;

        if (isPreview) {
          // For preview, use STLLoader directly with the file URL
          modelData = await new Promise((resolve, reject) => {
            loader.load(
              url,
              (geometry) => resolve(geometry),
              undefined,
              (error) => reject(error)
            );
          });
        } else {
          // Load remote URL
          modelData = await new Promise((resolve, reject) => {
            loader.load(
              fullUrl,
              (geometry) => resolve(geometry),
              undefined,
              (error) => reject(error)
            );
          });
        }

        if (modelData) {
          console.log('STL loaded successfully');
          modelData.center();
          modelData.computeVertexNormals();
          modelData.computeBoundingBox();
          setGeometry(modelData);
          onLoad();
        }
      } catch (error) {
        console.error('Error loading STL:', error);
        onError('Failed to load 3D model');
      }
    };

    loadModel();
  }, [url, onError, onLoad, isPreview]);

  if (!geometry) return null;

  const boundingBox = geometry.boundingBox;
  const modelHeight = boundingBox ? (boundingBox.max.y - boundingBox.min.y) : 0;
  const yOffset = (modelHeight * 0.1) / 2;

  return (
    <mesh geometry={geometry} scale={0.1} position={[0, yOffset, 0]}>
      <meshPhongMaterial 
        color="#888888"
        shininess={100}
        specular="#ffffff"
      />
    </mesh>
  );
}

export default function ModelViewer({ modelUrl, width = "100%", height = "300px", isPreview = false }: ModelViewerProps) {
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    setError('');
    console.log('ModelViewer: Loading new model:', modelUrl, isPreview ? '(preview)' : '(remote)');
  }, [modelUrl, isPreview]);

  const handleLoad = () => {
    console.log('Model loaded successfully');
    setIsLoading(false);
  };

  if (error) {
    return (
      <div style={{ width, height }} className="flex items-center justify-center bg-gray-800 rounded-lg">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div style={{ width, height }} className="relative">
      <Canvas 
        camera={{ position: [15, 10, 15], fov: 50 }}
        style={{ background: '#1f2937' }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} />
        <directionalLight position={[-5, 5, -5]} intensity={0.4} />
        <Model 
          url={modelUrl} 
          onError={setError}
          onLoad={handleLoad}
          isPreview={isPreview}
        />
        <OrbitControls 
          enableZoom={true}
          enablePan={true}
          enableRotate={true}
          autoRotate={true}
          autoRotateSpeed={2}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI / 2}
        />
        <gridHelper 
          args={[30, 30]} 
          position={[0, 0, 0]}
          rotation={[0, 0, 0]}
        />
      </Canvas>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-75">
          <p className="text-white">Loading model...</p>
        </div>
      )}
    </div>
  );
} 