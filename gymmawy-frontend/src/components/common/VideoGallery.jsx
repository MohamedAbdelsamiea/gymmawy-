import { useState, useEffect } from 'react';
import { Play, Calendar, Eye } from 'lucide-react';
import VideoPlayer from './VideoPlayer';
import videoService from '../../services/videoService';

const VideoGallery = ({ 
  title = "Our Videos", 
  maxVideos = 6, 
  showTitle = true,
  className = "", 
}) => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchVideos = async() => {
      try {
        setLoading(true);
        setError(null);
        const response = await videoService.getVideos({ 
          pageSize: maxVideos,
          sortBy: 'createdAt',
          sortOrder: 'desc',
        });
        // Filter for active videos only
        const activeVideos = (response.items || []).filter(video => video.isActive === true);
        setVideos(activeVideos);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching videos:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, [maxVideos]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className={`py-12 ${className}`}>
        {showTitle && (
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">{title}</h2>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="bg-gray-200 rounded-lg aspect-video animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`py-12 ${className}`}>
        {showTitle && (
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">{title}</h2>
          </div>
        )}
        <div className="text-center text-red-600">
          <p>Error loading videos: {error}</p>
        </div>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className={`py-12 ${className}`}>
        {showTitle && (
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">{title}</h2>
          </div>
        )}
        <div className="text-center text-gray-500">
          <p>No videos available at the moment.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`py-12 ${className}`}>
      {showTitle && (
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">{title}</h2>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {videos.map((video) => (
          <div key={video.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
            {/* Video Player */}
            <div className="aspect-video">
              <VideoPlayer
                videoUrl={video.videoUrl}
                thumbnailEn={video.thumbnailEn}
                thumbnailAr={video.thumbnailAr}
                title={video.title?.en || video.title?.ar || 'Video'}
                className="w-full h-full"
                showControls={false}
                autoPlay={false}
                muted={false}
              />
            </div>
            
            {/* Video Info */}
            <div className="p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                {video.title?.en || video.title?.ar || 'Untitled Video'}
              </h3>
              
              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(video.createdAt)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Eye className="h-4 w-4" />
                  <span>View</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VideoGallery;
