'use client'

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import PaintingBoard from './components/paintingBoard/paintingBoard';
import { FiCopy, FiShare2, FiUsers, FiSettings, FiHelpCircle } from 'react-icons/fi';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { BsFillPaletteFill } from 'react-icons/bs';
import styles from './components/paintingBoard/paintingBoard.module.css';
import Canvas from './components/canvas/canvas';


const Home: React.FC = () => {
  const [currentColor, setCurrentColor] = useState('#4a6bff');
  const [roomId, setRoomId] = useState('default-room');
  const [activeTab, setActiveTab] = useState('canvas');
  const [showRoomSettings, setShowRoomSettings] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [participants, setParticipants] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showRoomInfo, setShowRoomInfo] = useState(false);

  // Generate a random room ID if empty
  useEffect(() => {
    if (!roomId || roomId === 'default-room') {
      const randomId = Math.random().toString(36).substring(2, 8);
      setRoomId(`room-${randomId}`);
    }
  }, []);

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    toast.success('Room ID copied to clipboard!', {
      position: 'bottom-right',
      autoClose: 2000,
    });
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      const elem = document.querySelector(`.${styles.boardContainer}`);
      if (elem?.requestFullscreen) {
        elem.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  const shareRoom = async () => {
    try {
      await navigator.share({
        title: 'Join my painting room',
        text: `Let's draw together! Join room ${roomId}`,
        url: window.location.href,
      });
    } catch (err) {
      copyRoomId();
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
      <Head>
        <title>ArtSync | Collaborative Painting Board</title>
        <meta name="description" content="Real-time collaborative digital canvas for creative minds" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <ToastContainer />

      {/* Navigation Sidebar */}
      <div className="fixed left-0 top-0 bottom-0 w-16 bg-white shadow-lg z-10 flex flex-col items-center py-4">
        <div className="mb-8">
          <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">
            AS
          </div>
        </div>

        <nav className="flex-1 flex flex-col items-center space-y-6">
          <button
            onClick={() => setActiveTab('canvas')}
            className={`p-2 rounded-lg transition-all ${activeTab === 'canvas' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-600 hover:bg-gray-100'}`}
            aria-label="Canvas"
          >
            <BsFillPaletteFill className="w-5 h-5" />
          </button>

          <button
            onClick={() => setShowRoomSettings(true)}
            className={`p-2 rounded-lg transition-all ${showRoomSettings ? 'bg-indigo-100 text-indigo-600' : 'text-gray-600 hover:bg-gray-100'}`}
            aria-label="Room Settings"
          >
            <FiUsers className="w-5 h-5" />
          </button>

          <button
            onClick={() => setShowTutorial(true)}
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-all"
            aria-label="Help"
          >
            <FiHelpCircle className="w-5 h-5" />
          </button>
          <button
            className={styles.fullscreenButton}
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            <svg viewBox="0 0 24 24" width="20" height="20">
              {isFullscreen ? (
                <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
              ) : (
                <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
              )}
            </svg>
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="ml-16 flex-1 flex flex-col">
        {/* Header */}
        <header className="py-4 bg-white shadow-sm">
          <div className="container mx-auto px-6 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                ArtSync Canvas
              </h1>
              <p className="text-sm text-gray-500">Real-time collaborative drawing</p>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-gray-100 rounded-full px-4 py-2">
                <span className="text-sm text-gray-600">Room:</span>
                <span className="font-medium text-gray-800">{roomId}</span>
                <button
                  onClick={copyRoomId}
                  className="text-gray-500 hover:text-indigo-600 transition-colors"
                  aria-label="Copy room ID"
                >
                  <FiCopy className="w-4 h-4" />
                </button>
                <button
                  onClick={shareRoom}
                  className="text-gray-500 hover:text-indigo-600 transition-colors"
                  aria-label="Share room"
                >
                  <FiShare2 className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center space-x-2 bg-gray-100 rounded-full px-4 py-2">
                <span className="text-sm text-gray-600">Color:</span>
                <div
                  className="w-5 h-5 rounded-full border border-gray-300 shadow-sm"
                  style={{ backgroundColor: currentColor }}
                />
                <span className="text-sm font-medium text-gray-800">
                  {currentColor.toUpperCase()}
                </span>
              </div>

              <div className="flex items-center space-x-2 bg-gray-100 rounded-full px-4 py-2">
                <FiUsers className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-800">
                  {participants} {participants === 1 ? 'person' : 'people'} online
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 container mx-auto px-6 py-6 h-full">
          {activeTab === 'canvas' && (
              <Canvas
                roomId={roomId}
           
                className="h-full"

              />
          )}
        </main>

        {/* Room Settings Panel */}
        {showRoomSettings && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">Room Settings</h2>
                <button
                  onClick={() => setShowRoomSettings(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  &times;
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Room ID</label>
                  <div className="flex">
                    <input
                      type="text"
                      value={roomId}
                      onChange={(e) => setRoomId(e.target.value)}
                      className="flex-1 px-3 py-2 border rounded-l-md focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <button
                      onClick={copyRoomId}
                      className="px-3 py-2 bg-indigo-600 text-white rounded-r-md hover:bg-indigo-700 transition-colors"
                    >
                      <FiCopy className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Participants: {participants}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={participants}
                    onChange={(e) => setParticipants(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setShowRoomSettings(false);
                      toast.success('Settings saved');
                    }}
                    className="w-full py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                  >
                    Save Settings
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tutorial Panel */}
        {showTutorial && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">How to Use</h2>
                <button
                  onClick={() => setShowTutorial(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  &times;
                </button>
              </div>

              <div className="space-y-3 text-gray-700">
                <div className="flex items-start space-x-3">
                  <div className="mt-1 flex-shrink-0">
                    <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                      1
                    </div>
                  </div>
                  <p>Share the Room ID with collaborators to draw together in real-time</p>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="mt-1 flex-shrink-0">
                    <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                      2
                    </div>
                  </div>
                  <p>Use the toolbar to select colors, brush sizes, and tools</p>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="mt-1 flex-shrink-0">
                    <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                      3
                    </div>
                  </div>
                  <p>Save your artwork or clear the canvas when needed</p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowTutorial(false)}
                  className="w-full py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                >
                  Got It!
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="py-4 bg-white border-t border-gray-200">
          <div className="container mx-auto px-6 flex justify-between items-center">
            <p className="text-sm text-gray-600">
              &copy; {new Date().getFullYear()} ArtSync. All rights reserved.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-sm text-gray-600 hover:text-indigo-600">Terms</a>
              <a href="#" className="text-sm text-gray-600 hover:text-indigo-600">Privacy</a>
              <a href="#" className="text-sm text-gray-600 hover:text-indigo-600">Contact</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Home;