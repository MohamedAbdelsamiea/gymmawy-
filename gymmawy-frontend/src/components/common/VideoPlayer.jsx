import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const VideoPlayer = ({ 
  videoUrl, 
  thumbnailEn, 
  thumbnailAr, 
  title = '', 
  className = '',
  showControls = true,
  autoPlay = false,
  muted = false, // Changed default to false for audio on by default
  hideIfNoVideo = false, // New prop to hide component when no video is available
}) => {
  const { i18n } = useTranslation();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(muted);
  const [showThumbnail, setShowThumbnail] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showTimeSlider, setShowTimeSlider] = useState(false);
  const videoRef = useRef(null);
  const containerRef = useRef(null);

  // Video event handlers
  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
return;
}

    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleLoadedMetadata = () => setDuration(video.duration);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      setIsPlaying(false);
      setShowThumbnail(true);
      setCurrentTime(0);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
    };
  }, []);

  const handlePlayPause = async() => {
    if (videoRef.current) {
      try {
        if (isPlaying) {
          videoRef.current.pause();
        } else {
          // Ensure video is loaded before playing
          if (videoRef.current.readyState < 3) {
            console.log('Video not ready, loading...');
            videoRef.current.load();
            await new Promise((resolve) => {
              videoRef.current.addEventListener('canplay', resolve, { once: true });
            });
          }
          
          const playPromise = videoRef.current.play();
          if (playPromise !== undefined) {
            await playPromise;
            setShowThumbnail(false);
            console.log('Video started playing successfully');
          }
        }
      } catch (error) {
        console.error('Error playing video:', error);
        // Handle autoplay restrictions
        if (error.name === 'NotAllowedError') {
          console.log('Autoplay blocked, user interaction required');
          // Try to play with muted first
          videoRef.current.muted = true;
          setIsMuted(true);
          try {
            await videoRef.current.play();
            setShowThumbnail(false);
            console.log('Video started playing muted');
          } catch (mutedError) {
            console.error('Even muted play failed:', mutedError);
          }
        }
      }
    }
  };

  const handleMuteToggle = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleTimeSliderChange = (e) => {
    if (videoRef.current) {
      const newTime = parseFloat(e.target.value);
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleFullscreen = () => {
    if (containerRef.current) {
      if (!document.fullscreenElement) {
        containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  const handleVideoClick = async() => {
    if (showThumbnail) {
      console.log('Video thumbnail clicked, starting playback...');
      await handlePlayPause();
    }
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Get the appropriate thumbnail based on language
  const getThumbnail = () => {
    const currentLanguage = i18n.language;
    if (currentLanguage === 'ar' && thumbnailAr) {
      return thumbnailAr;
    }
    return thumbnailEn || thumbnailAr;
  };

  // Get the appropriate title based on language
  const getTitle = () => {
    const currentLanguage = i18n.language;
    if (typeof title === 'object') {
      if (currentLanguage === 'ar' && title.ar) {
        return title.ar;
      }
      return title.en || title.ar || 'Video';
    }
    return title || 'Video';
  };

  // If hideIfNoVideo is true and no video URL is provided, don't render anything
  if (hideIfNoVideo && !videoUrl) {
    return null;
  }

  return (
    <>
      <style jsx="true">{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #8B5CF6;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        
        .slider::-moz-range-thumb {
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #8B5CF6;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        
        .slider::-webkit-slider-track {
          height: 4px;
          border-radius: 2px;
        }
        
        .slider::-moz-range-track {
          height: 4px;
          border-radius: 2px;
        }
        
        /* RTL Support for slider */
        [dir="rtl"] .slider {
          direction: rtl;
        }
        
        [dir="rtl"] .slider::-webkit-slider-thumb {
          transform: scaleX(-1);
        }
        
        [dir="rtl"] .slider::-moz-range-thumb {
          transform: scaleX(-1);
        }
      `}</style>
      <div 
        ref={containerRef}
        className={`relative w-full bg-black overflow-hidden group ${showThumbnail ? 'aspect-video' : ''} ${className}`}
        onMouseEnter={() => setShowTimeSlider(true)}
        onMouseLeave={() => setShowTimeSlider(false)}
      >
      {/* Video Element */}
      <video
        ref={videoRef}
        className="w-full h-auto max-h-[80vh] object-contain"
        muted={isMuted}
        preload="metadata"
        playsInline
        onLoadStart={() => console.log('Video load started')}
        onLoadedData={() => console.log('Video data loaded')}
        onCanPlay={() => console.log('Video can play')}
        onError={(e) => console.error('Video error:', e)}
      >
        <source src={videoUrl} type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Thumbnail Overlay */}
      {showThumbnail && getThumbnail() && (
        <div 
          className="absolute inset-0 cursor-pointer aspect-video"
          onClick={handleVideoClick}
        >
          <img
            src={getThumbnail()}
            alt={getTitle()}
            className="w-full h-full object-fill"
          />
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
            <div className="w-24 h-24 bg-transparent border-4 border-white rounded-full flex items-center justify-center hover:scale-110 transition-transform duration-300">
              <Play size={40} className={`text-white ${i18n.language === 'ar' ? 'mr-1' : 'ml-1'}`} />
            </div>
          </div>
        </div>
      )}

      {/* Video Controls */}
      {showControls && !showThumbnail && (
        <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300 ${showTimeSlider ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
          {/* Time Slider */}
          <div className="mb-3">
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleTimeSliderChange}
              className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
              style={{
                background: i18n.language === 'ar' 
                  ? `linear-gradient(to left, #8B5CF6 0%, #8B5CF6 ${(currentTime / duration) * 100}%, #4B5563 ${(currentTime / duration) * 100}%, #4B5563 100%)`
                  : `linear-gradient(to right, #8B5CF6 0%, #8B5CF6 ${(currentTime / duration) * 100}%, #4B5563 ${(currentTime / duration) * 100}%, #4B5563 100%)`,
              }}
            />
          </div>
          
          {/* Control Buttons */}
          <div className={`flex items-center justify-between ${i18n.language === 'ar' ? 'flex-row-reverse' : ''}`}>
            <div className={`flex items-center ${i18n.language === 'ar' ? 'space-x-reverse space-x-3' : 'space-x-3'}`}>
              <button
                onClick={handlePlayPause}
                className="text-white hover:text-gray-300 transition-colors"
              >
                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
              </button>
              
              <button
                onClick={handleMuteToggle}
                className="text-white hover:text-gray-300 transition-colors"
              >
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
              
              <span className={`text-white text-sm font-medium ${i18n.language === 'ar' ? 'text-right' : 'text-left'}`}>{getTitle()}</span>
            </div>
            
            <div className={`flex items-center ${i18n.language === 'ar' ? 'space-x-reverse space-x-3' : 'space-x-3'}`}>
              <span className={`text-white text-sm ${i18n.language === 'ar' ? 'text-right' : 'text-left'}`}>
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
              
              <button
                onClick={handleFullscreen}
                className="text-white hover:text-gray-300 transition-colors"
              >
                <Maximize2 size={20} />
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
};

export default VideoPlayer;
