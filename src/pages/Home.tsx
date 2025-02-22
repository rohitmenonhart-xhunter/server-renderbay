import React from 'react';
import { Link } from 'react-router-dom';
import { Cuboid as Cube, Palette, Users } from 'lucide-react';

function Home() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-8">Welcome to 3D Market</h1>
        <p className="text-xl text-gray-400 mb-12">
          Your premier marketplace for 3D models and digital assets
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 mt-12">
        <div className="bg-gray-800 p-6 rounded-lg">
          <Cube className="h-12 w-12 text-blue-500 mb-4" />
          <h2 className="text-xl font-bold mb-4">Browse Models</h2>
          <p className="text-gray-400 mb-4">
            Explore our vast collection of high-quality 3D models
          </p>
          <Link
            to="/marketplace"
            className="inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Visit Marketplace
          </Link>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg">
          <Palette className="h-12 w-12 text-purple-500 mb-4" />
          <h2 className="text-xl font-bold mb-4">For Artists</h2>
          <p className="text-gray-400 mb-4">
            Share your creations with the world and earn from your talent
          </p>
          <Link
            to="/auth"
            className="inline-block bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
          >
            Join as Artist
          </Link>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg">
          <Users className="h-12 w-12 text-green-500 mb-4" />
          <h2 className="text-xl font-bold mb-4">Community</h2>
          <p className="text-gray-400 mb-4">
            Connect with other creators and enthusiasts
          </p>
          <Link
            to="/auth"
            className="inline-block bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Join Community
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Home;