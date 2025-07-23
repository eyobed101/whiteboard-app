'use client'
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { FiCopy, FiShare2, FiUsers, FiSettings, FiHelpCircle } from 'react-icons/fi';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { BsFillPaletteFill } from 'react-icons/bs';
import Canvas from './components/canvas/canvas';
import styles from './home.module.css';

const Home: React.FC = () => {
  const [currentColor, setCurrentColor] = useState('#4a6bff');
  const [roomId, setRoomId] = useState('');
  const [activeTab, setActiveTab] = useState('canvas');
  const [showRoomSettings, setShowRoomSettings] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [participants, setParticipants] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showRoomInfo, setShowRoomInfo] = useState(false);
  // In your Home component

  // Add this useEffect to handle participant updates
  useEffect(() => {
    const handleParticipantsUpdate = (count: number) => {
      setParticipants(count);
    };

    window.addEventListener('participants-update', ((e: CustomEvent<number>) => {
      handleParticipantsUpdate(e.detail);
    }) as EventListener);

    return () => {
      window.removeEventListener('participants-update', ((e: CustomEvent<number>) => {
        handleParticipantsUpdate(e.detail);
      }) as EventListener);
    };
  }, []);

  // Initialize room ID from URL or generate a new one
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlRoomId = params.get('room');

      if (urlRoomId) {
        setRoomId(urlRoomId);
      } else {
        const randomId = Math.random().toString(36).substring(2, 8);
        setRoomId(`room-${randomId}`);
        // Update URL without page reload
        window.history.pushState({}, '', `?room=room-${randomId}`);
      }
    }
  }, []);

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    toast.success('Room ID copied to clipboard!', {
      position: 'bottom-right',
      autoClose: 2000,
    });
  };

  const shareRoom = async () => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?room=${roomId}`;

    try {
      await navigator.share({
        title: 'Join my collaborative canvas',
        text: `Let's draw together! Join room ${roomId}`,
        url: shareUrl,
      });
    } catch (err) {
      // Fallback to copy if Web Share API not supported
      navigator.clipboard.writeText(shareUrl);
      toast.success('Room link copied to clipboard!', {
        position: 'bottom-right',
        autoClose: 2000,
      });
    }
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        elem.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  const regenerateRoomId = () => {
    const randomId = Math.random().toString(36).substring(2, 8);
    const newRoomId = `room-${randomId}`;
    setRoomId(newRoomId);
    window.history.pushState({}, '', `?room=${newRoomId}`);
    toast.success('New room created! Share the new link with collaborators.');
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
            onClick={() => setShowRoomInfo(true)}
            className={`p-2 rounded-lg transition-all ${showRoomInfo ? 'bg-indigo-100 text-indigo-600' : 'text-gray-600 hover:bg-gray-100'}`}
            aria-label="Room Info"
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
            onClick={toggleFullscreen}
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-all"
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullscreen ? (
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
              </svg>
            )}
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
          {activeTab === 'canvas' && roomId && (
            <Canvas
              roomId={roomId}
              onColorChange={setCurrentColor}
              onParticipantsChange={setParticipants} // Add this

              className="h-full"
            />
          )}
        </main>

        {/* Room Info Panel */}
        {showRoomInfo && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">Room Information</h2>
                <button
                  onClick={() => setShowRoomInfo(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  &times;
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Room ID</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={roomId}
                      readOnly
                      className="flex-1 px-3 py-2 border rounded-md bg-gray-50"
                    />
                    <button
                      onClick={copyRoomId}
                      className="p-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                    >
                      <FiCopy className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Share this room
                  </label>
                  <div className="flex space-x-2">
                    <button
                      onClick={shareRoom}
                      className="flex-1 flex items-center justify-center space-x-2 py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                    >
                      <FiShare2 className="w-5 h-5" />
                      <span>Share Link</span>
                    </button>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={regenerateRoomId}
                    className="w-full py-2 px-4 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    Create New Room
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
                  <p>Share the room link with collaborators to draw together in real-time</p>
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