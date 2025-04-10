import { useEffect, useState, useRef } from "react";
import { X, Volume2, Monitor, Smartphone } from "lucide-react";

interface AdvertisementProps {
  onClose: () => void;
}

export default function Advertisement({ onClose }: AdvertisementProps) {
  const [canSkip, setCanSkip] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [countdown, setCountdown] = useState(15);
  const [isMobile, setIsMobile] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);

  // Detect if user is on mobile device
  useEffect(() => {
    const checkDevice = () => {
      const userAgent = navigator.userAgent;
      const width = window.innerWidth;
      
      console.log("UserAgent:", userAgent);
      console.log("Window width:", width);
      
      const mobileCheck = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent) || width < 768;
      
      console.log("Is mobile detected:", mobileCheck);
      setIsMobile(mobileCheck);
    };

    checkDevice();
    window.addEventListener("resize", checkDevice);
    return () => window.removeEventListener("resize", checkDevice);
  }, []);

  // Handle countdown timer
  useEffect(() => {
    const skipTimer = setTimeout(() => setCanSkip(true), 15000);
    
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => {
      clearTimeout(skipTimer);
      clearInterval(countdownInterval);
    };
  }, []);

  // Add video event listeners for debugging
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    const handleError = (e: Event) => {
      console.error("Video error event triggered:", e);
      if (video.error) {
        console.error("Error code:", video.error.code);
        console.error("Error message:", video.error.message);
        setVideoError(`Error ${video.error.code}: ${video.error.message}`);
      }
    };
    
    const handleLoadedData = () => {
      console.log("Video data loaded successfully");
    };
    
    const handleCanPlay = () => {
      console.log("Video can play now");
    };
    
    video.addEventListener('error', handleError);
    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('canplay', handleCanPlay);
    
    return () => {
      video.removeEventListener('error', handleError);
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('canplay', handleCanPlay);
    };
  }, []);

  // Try to enable audio as soon as component loads
  useEffect(() => {
    const attemptAutoplay = async () => {
      try {
        console.log("Video ref exists:", !!videoRef.current);
        console.log("Attempting to play video");
        
        if (videoRef.current) {
          videoRef.current.muted = false;
          await videoRef.current.play();
          console.log("Video playing successfully with sound");
          setIsPlaying(true);
          setAudioEnabled(true);
        }
      } catch (error) {
        console.error("Autoplay with sound failed:", error instanceof Error ? error.message : error);
        
        // If autoplay with sound fails, we'll need user interaction
        if (videoRef.current) {
          videoRef.current.muted = true;
        }
      }
    };

    attemptAutoplay();
  }, []);

  // Handle play button click - with unmuted audio
  const handlePlay = async () => {
    if (videoRef.current) {
      try {
        console.log("Play button clicked, attempting to play with sound");
        videoRef.current.muted = false;
        await videoRef.current.play();
        console.log("Play with sound successful");
        setIsPlaying(true);
        setAudioEnabled(true);
      } catch (error) {
        console.error("Play with unmuted audio failed:", error instanceof Error ? error.message : error);
        
        // If unmuted play fails, try muted first then unmute
        try {
          console.log("Attempting muted play as fallback");
          videoRef.current.muted = true;
          await videoRef.current.play();
          setIsPlaying(true);
          
          // Now try to unmute after play started
          videoRef.current.muted = false;
          setAudioEnabled(true);
          console.log("Muted play successful, unmuted after starting");
        } catch (secondError) {
          console.error("Play failed even with mute:", secondError instanceof Error ? secondError.message : secondError);
        }
      }
    }
  };

  // Choose video source based on device type - FIXED PATHS
  const videoSource = isMobile 
    ? "./video/mobile-ad.mp4"  // Adjust path based on your project structure
    : "./video/ad.mp4";         // Adjust path based on your project structure

  // Log the video source for debugging  
  console.log("Selected video source:", videoSource);

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
      {/* Device indicator */}
      <div className="absolute top-2 left-2 bg-gray-800 bg-opacity-60 text-white px-2 py-1 rounded-full text-xs flex items-center">
        {isMobile ? (
          <>
            <Smartphone size={16} className="mr-1" />
            <span>Mobile Ad</span>
          </>
        ) : (
          <>
            <Monitor size={16} className="mr-1" />
            <span>Desktop Ad</span>
          </>
        )}
      </div>

      {/* Responsive Container */}
      <div className="relative w-full h-full md:w-4/5 md:h-auto md:max-w-3xl md:aspect-video flex items-center justify-center">
        {/* Show error message if video failed to load */}
        {videoError && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-900 bg-opacity-80 text-white p-4 z-20 rounded-lg">
            <div className="text-center">
              <h3 className="text-xl font-bold mb-2">Video Error</h3>
              <p>{videoError}</p>
              <button 
                onClick={onClose}
                className="mt-4 bg-white text-red-900 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
        
        <video
          ref={videoRef}
          className="w-full h-auto max-h-full object-contain md:object-cover rounded-lg shadow-lg"
          playsInline
          controls={isPlaying}
          loop={false}
          onPlay={() => setIsPlaying(true)}
        >
          <source src={videoSource} type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        {/* Play Button with Audio Indication */}
        {!isPlaying && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-70 text-white rounded-lg">
            <button
              onClick={handlePlay}
              className="flex flex-col items-center p-6 bg-red-600 hover:bg-red-700 rounded-full mb-4 transition-colors"
            >
              <span className="text-4xl">▶</span>
            </button>
            <p className="text-lg font-medium">Click to Play Ad with Sound</p>
            <p className="text-sm opacity-80 mt-2">
              This advertisement includes audio
            </p>
          </div>
        )}

        {/* Audio Indicator */}
        {isPlaying && audioEnabled && (
          <div className="absolute top-4 left-4 bg-black bg-opacity-60 text-white px-3 py-1 rounded-full flex items-center">
            <Volume2 size={20} className="mr-1" />
            <span className="text-sm">Sound On</span>
          </div>
        )}

        {/* Skip Button (Appears After 15s) */}
        {canSkip && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md flex items-center gap-2 transition-colors"
          >
            <span>Skip Ad</span>
            <X size={20} />
          </button>
        )}

        {/* Countdown Timer */}
        {!canSkip && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm bg-black bg-opacity-60 px-3 py-1 rounded-md">
            You can skip this ad in {countdown} seconds
          </div>
        )}
      </div>
    </div>
  );
}