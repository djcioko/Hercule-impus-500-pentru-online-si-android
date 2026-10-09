import React, { useState, useRef, useEffect, useCallback } from 'react';

interface ImageUploadSectionProps {
  onImageReady: (file: File | Blob) => void;
  isLoading: boolean;
}

const ImageUploadSection: React.FC<ImageUploadSectionProps> = ({ onImageReady, isLoading }) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraStatusMessage, setCameraStatusMessage] = useState<string | null>(null); // New state for status messages
  const [captureFlash, setCaptureFlash] = useState<boolean>(false); // New state for capture flash animation

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const stopCamera = useCallback(() => {
    if (mediaStreamRef.current) {
      console.log('Stopping camera tracks.');
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      console.log('Removing video srcObject.');
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setCameraError(null); // Clear camera error when stopping camera
    setCameraStatusMessage(null); // Clear status message
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    setImagePreview(null); // Clear previous preview when starting camera
    setCameraStatusMessage("Waiting for camera permissions..."); // Set status message
    try {
      // Changed facingMode to 'user' for better laptop webcam compatibility
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play(); // Use await for play() to handle potential promise rejection
      }
      setIsCameraActive(true);
      setCameraStatusMessage(null); // Clear status message on success
      console.log('Camera started successfully.');
    } catch (err) {
      console.error("Error accessing camera:", err);
      if (err instanceof DOMException) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setCameraError("Camera access was denied. Please check your browser settings and allow access to the camera, then try again.");
        } else if (err.name === 'NotFoundError') {
          setCameraError("No camera found. Please ensure a camera is connected and enabled on your device.");
        } else if (err.name === 'NotReadableError') {
          setCameraError("Camera is already in use or unavailable. Please close other applications using the camera.");
        } else if (err.name === 'AbortError') {
            setCameraError("Camera access was aborted. You might have quickly closed the permission prompt or another process interfered.");
        } else {
          setCameraError(`Failed to access camera: ${err.message}.`);
        }
      } else {
        setCameraError("An unknown error occurred while trying to access the camera. Please try again.");
      }
      setIsCameraActive(false);
      setCameraStatusMessage(null); // Clear status message on error
    }
  }, []);

  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `captured_image_${Date.now()}.png`, { type: 'image/png' });
            setImagePreview(URL.createObjectURL(blob));
            onImageReady(file); // Trigger AI analysis
            console.log('Photo captured and onImageReady triggered.');
            
            // Trigger visual flash
            setCaptureFlash(true);
            setTimeout(() => {
              setCaptureFlash(false);
            }, 300); // Flash for 300ms
            
          } else {
            setCameraError("Failed to capture photo.");
          }
        }, 'image/png');
      }
    }
    stopCamera(); // Stop camera after capturing
  }, [onImageReady, stopCamera]);


  useEffect(() => {
    // Cleanup camera on component unmount
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      stopCamera(); // Stop camera if user uploads a file
      setImagePreview(URL.createObjectURL(file));
      onImageReady(file); // Trigger AI analysis
      console.log('File uploaded and onImageReady triggered.');
      // Clear the input value so the same file can be selected again
      event.target.value = '';
    }
  };

  const clearImagePreview = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview); // Clean up the object URL
    }
    setImagePreview(null);
    setCameraError(null); // Clear any related errors
    console.log('Image preview cleared.');
  };

  return (
    <div className="w-full">
      <h2 className="text-xl md:text-2xl font-bold mb-4 text-purple-400">📸 Visual Sensor (Camera & Upload)</h2>

      <div className="space-y-4">
        {!isCameraActive ? (
          <button
            onClick={startCamera}
            className="block w-full text-center py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md cursor-pointer transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
            aria-label="Start camera to take a photo"
          >
            <span className="text-lg">Start Camera</span>
          </button>
        ) : (
          <div className="flex space-x-4">
            <button
              onClick={capturePhoto}
              className="flex-1 text-center py-3 px-6 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow-md cursor-pointer transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
              aria-label="Capture Photo from live feed"
            >
              <span className="text-lg">Capture Photo</span>
            </button>
            <button
              onClick={stopCamera}
              className="flex-1 text-center py-3 px-6 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-md cursor-pointer transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
              aria-label="Stop camera feed"
            >
              <span className="text-lg">Stop Camera</span>
            </button>
          </div>
        )}
        
        {!isCameraActive && !isLoading && (
            <p className="text-center text-sm text-gray-500 mt-2" aria-live="polite">
                Click "Start Camera" to activate your webcam. Ensure you grant browser permissions.
            </p>
        )}

        {/* File Upload Input */}
        <label htmlFor="file-upload" className={`block w-full text-center py-3 px-6 ${isLoading || isCameraActive ? 'bg-gray-600 cursor-not-allowed' : 'bg-gray-700 hover:bg-gray-600 cursor-pointer'} text-white font-semibold rounded-lg shadow-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}
               aria-label="Upload an image file from your device">
          <span className="text-lg">Or Upload File</span>
          <input
            id="file-upload"
            type="file"
            accept="image/png, image/jpeg, image/jpg"
            onChange={handleFileChange}
            className="hidden"
            disabled={isLoading || isCameraActive} // Disable upload if camera is active
          />
        </label>
      </div>

      {cameraStatusMessage && !cameraError && (
        <div className="mt-4 text-blue-300 text-center font-medium p-3 bg-blue-900 rounded-lg shadow-md" role="status" aria-live="polite">
          {cameraStatusMessage}
        </div>
      )}

      {cameraError && (
        <div className="mt-4 text-red-400 text-center font-medium p-3 bg-red-900 rounded-lg shadow-md" role="alert" aria-live="polite">
          {cameraError}
        </div>
      )}

      {isCameraActive && (
        <div className={`mt-8 relative border-2 rounded-lg overflow-hidden transition-all duration-150 ${captureFlash ? 'border-green-400 ring-4 ring-green-400 ring-opacity-70' : 'border-purple-600'}`}>
          <video ref={videoRef} className="w-full h-auto object-cover" autoPlay playsInline muted></video>
          <canvas ref={canvasRef} className="hidden"></canvas> {/* Hidden canvas for capture */}
          <div className="absolute top-0 left-0 w-full p-2 bg-black bg-opacity-70 text-white text-sm text-center font-semibold">
            Live Camera Feed
          </div>
        </div>
      )}

      {imagePreview && ( // Display preview if available, regardless of camera active state
        <div className="mt-8">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold text-gray-300">Image Preview:</h3>
            <button
              onClick={clearImagePreview}
              className="text-sm text-gray-400 hover:text-gray-200 transition-colors duration-200 px-4 py-2 bg-gray-700 rounded-lg shadow-md" // Increased padding and rounded-lg
              aria-label="Clear image preview"
            >
              Clear Preview
            </button>
          </div>
          <img
            src={imagePreview}
            alt="Uploaded or Captured"
            className="w-full h-auto object-cover rounded-lg shadow-xl border border-gray-700"
          />
        </div>
      )}

      {isLoading && (
        <div className="mt-8 flex items-center justify-center text-lg text-purple-300" role="status" aria-live="assertive">
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-purple-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Gemini is analyzing the vibe...
        </div>
      )}
    </div>
  );
};

export default ImageUploadSection;