import React, { useState, useEffect, useRef } from 'react';
import { Premiere } from '../../types/premiere';
import { Video, VideoVariant } from '../../types/video';
import VideoPlayer, { VideoPlayerRef } from '../video/VideoPlayer';
import socketService from '../../services/socketService';

interface LivePremiereProps {
  premiere: Premiere;
  onClose?: () => void;
}

interface ChatMessage {
  id: number;
  user: string;
  message: string;
  timestamp: Date;
}

const LivePremiere: React.FC<LivePremiereProps> = ({ premiere, onClose }) => {
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [viewerCount, setViewerCount] = useState(premiere.totalViewers);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const videoRef = useRef<VideoPlayerRef>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Join the premiere room
    socketService.joinPremiere(premiere._id);

    // Set up socket event listeners
    socketService.onPremiereJoined((data) => {
      console.log('Premiere joined:', data);
      setViewerCount(data.viewerCount);
      setChatMessages(data.chat || []);
    });

    socketService.onViewerJoined((data) => {
      setViewerCount(data.viewerCount);
    });

    socketService.onViewerLeft((data) => {
      setViewerCount(data.viewerCount);
    });

    socketService.onPremiereStarted((data) => {
      console.log('Premiere started:', data);
    });

    socketService.onPremiereEnded((data) => {
      console.log('Premiere ended:', data);
      if (onClose) onClose();
    });

    socketService.onVideoPlay(() => {
      if (videoRef.current) {
        videoRef.current.play();
      }
    });

    socketService.onVideoPause(() => {
      if (videoRef.current) {
        videoRef.current.pause();
      }
    });

    socketService.onVideoSeek((data) => {
      if (videoRef.current) {
        videoRef.current.seek(data.time);
      }
    });

    socketService.onNewMessage((message) => {
      setChatMessages(prev => [...prev, message]);
      scrollToBottom();
    });

    socketService.onError((error) => {
      console.error('Socket error:', error);
    });

    // Update time remaining
    const updateTimeRemaining = () => {
      const remaining = socketService.getTimeUntilEnd(premiere.endTime);
      setTimeRemaining(remaining);
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 1000);

    return () => {
      clearInterval(interval);
      socketService.leavePremiere(premiere._id);
      socketService.removeAllListeners();
    };
  }, [premiere, onClose]);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  const formatTimeRemaining = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      socketService.sendMessage(premiere._id, newMessage.trim());
      setNewMessage('');
    }
  };

  const handleVideoPlay = () => {
    socketService.playVideo(premiere._id);
  };

  const handleVideoPause = () => {
    socketService.pauseVideo(premiere._id);
  };

  const handleVideoSeek = (time: number) => {
    socketService.seekVideo(premiere._id, time);
  };

  // Convert premiere video to Video type for VideoPlayer
  const videoForPlayer: Video = {
    _id: premiere.video._id,
    title: premiere.video.title,
    description: premiere.video.description,
    duration: premiere.video.duration,
    resolution: premiere.video.resolution,
    fileSize: 0,
    uploadedBy: {
      _id: premiere.createdBy._id,
      username: premiere.createdBy.username,
      email: 'premiere@pakstream.com'
    },
    originalFile: {
      filename: '',
      path: '',
      size: 0,
      mimetype: 'video/mp4',
      duration: premiere.video.duration
    },
    status: 'ready',
    processingProgress: 100,
    views: 0,
    likes: 0,
    dislikes: 0,
    tags: [],
    category: 'movie',
    isPublic: true,
    isFeatured: false,
    createdAt: premiere.createdAt,
    updatedAt: premiere.updatedAt,
    processedFiles: {
      hls: {
        masterPlaylist: premiere.video.processedFiles.hls.masterPlaylist,
        segments: [],
        variants: premiere.video.processedFiles.hls.variants.map(v => ({
          resolution: v.resolution,
          bitrate: v.bitrate,
          playlist: v.playlist,
          segments: v.segments
        })) as VideoVariant[]
      },
      thumbnails: premiere.video.processedFiles.thumbnails,
      poster: premiere.video.processedFiles.poster
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex">
      {/* Main Video Area */}
      <div className="flex-1 flex flex-col">
        {/* Premiere Header */}
        <div className="bg-gradient-to-b from-black to-transparent p-6 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></div>
                <span className="text-red-600 font-bold text-sm">LIVE</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">{premiere.title}</h1>
                <p className="text-gray-300">{premiere.description}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              {/* Viewer Count */}
              <div className="text-center">
                <div className="text-white font-bold text-lg">{viewerCount}</div>
                <div className="text-gray-400 text-sm">Viewers</div>
              </div>
              
              {/* Time Remaining */}
              <div className="text-center">
                <div className="text-white font-bold text-lg">
                  {formatTimeRemaining(timeRemaining)}
                </div>
                <div className="text-gray-400 text-sm">Remaining</div>
              </div>
              
              {/* Close Button */}
              {onClose && (
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-white text-2xl p-2"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Video Player */}
        <div className="flex-1 pt-4">
          <VideoPlayer
            video={videoForPlayer}
            autoPlay={true}
            controls={true}
            className="h-full"
            onPlay={handleVideoPlay}
            onPause={handleVideoPause}
            onSeek={handleVideoSeek}
            ref={videoRef}
          />
        </div>

        {/* Premiere Info Overlay */}
        <div className="bg-gradient-to-t from-black to-transparent p-6">
          <div className="flex items-center justify-between">
            <div className="text-white">
              <p className="text-sm text-gray-300">
                Created by {premiere.createdBy.username}
              </p>
              <p className="text-xs text-gray-400">
                Started {new Date(premiere.startTime).toLocaleString()}
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <div className="text-white font-bold">{premiere.video.resolution}</div>
                <div className="text-gray-400 text-xs">Quality</div>
              </div>
              <div className="text-center">
                <div className="text-white font-bold">
                  {Math.floor(premiere.video.duration / 60)}:{(premiere.video.duration % 60).toString().padStart(2, '0')}
                </div>
                <div className="text-gray-400 text-xs">Duration</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Sidebar */}
      <div className="w-80 bg-gray-900 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <h3 className="text-white font-semibold">Live Chat</h3>
          <p className="text-gray-400 text-sm">{viewerCount} viewers</p>
        </div>
        
        <div 
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto p-4 space-y-2"
        >
          {chatMessages.map((message) => (
            <div key={message.id} className="text-sm">
              <span className="text-blue-400 font-medium">{message.user}:</span>
              <span className="text-white ml-2">{message.message}</span>
              <div className="text-gray-500 text-xs">
                {new Date(message.timestamp).toLocaleTimeString()}
              </div>
            </div>
          ))}
        </div>
        
        <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-700">
          <div className="flex space-x-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 px-3 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LivePremiere;
