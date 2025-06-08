import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, ChevronLeft, Image } from 'lucide-react';

type InstagramUploadModalProps = {
  onClose: () => void;
  onPost: (image: string, caption: string) => Promise<void>;
};

const InstagramUploadModal: React.FC<InstagramUploadModalProps> = ({ onClose, onPost }) => {
  const [step, setStep] = useState('initial');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const modalRef = useRef(null);
  const [error, setError] = useState("");

  const handleClose = () => {
    setStep('initial');
    setSelectedImage(null);
    setCaption('');
    setError('');
    setIsUploading(false);
    onClose();
  };

  // Handle clicking outside the modal
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !(modalRef.current as HTMLElement).contains(event.target as Node)) {
        handleClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  type FileUploadEvent = React.ChangeEvent<HTMLInputElement>

  const handleFileUpload = (event: FileUploadEvent) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      
      // Create URL for preview
      const fileURL = URL.createObjectURL(file);
      setSelectedImage(fileURL);
      
      // Also convert to base64 for later submission
      const reader = new FileReader();
      reader.onloadend = () => {
        // Store the base64 result for later submission
        const base64 = (reader.result as string).split(',')[1]; // Extract only the base64 part
        setImageBase64(base64);
      };
      reader.readAsDataURL(file);
      
      setStep('preview');
    }
  };

  const handleSubmit = async () => {
    if (!caption.trim()) {
      setError("Please write a caption before sharing.");
      return;
    }
    
    if (!imageBase64) {
      setError("Please wait for image processing to complete.");
      return;
    }

    setError(""); // Clear error on successful post
    setIsUploading(true);
    
    try {
      await onPost(imageBase64, caption);
      handleClose();
    } catch (error) {
      console.error("Error posting:", error);
      setError("Failed to create post. Please try again.");
      setIsUploading(false);
    }
  };

  const handleOpenCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      const videoElement = document.createElement('video');
      videoElement.srcObject = stream;
      videoElement.play();
      
      setTimeout(() => {
        const canvas = document.createElement('canvas');
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;
        canvas.getContext('2d')?.drawImage(videoElement, 0, 0);
        const imageData = canvas.toDataURL('image/png');
        setSelectedImage(imageData);
        setImageBase64(imageData); // Make sure to set the base64 data too
        setStep('preview');
        stream.getTracks().forEach((track) => track.stop());
      }, 3000);
    } catch (error) {
      console.error('Error accessing camera:', error);
      setError("Could not access camera. Please check your permissions.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div 
        ref={modalRef} 
        className="bg-white rounded-xl w-full max-w-md overflow-hidden relative shadow-lg h-auto min-h-[550px] flex flex-col"
      >
        {/* Header */}
        <div className="border-b border-gray-200 p-4 flex items-center justify-between">
          {step !== 'initial' && !isUploading && (
            <button 
              onClick={() => setStep(step === 'caption' ? 'preview' : 'initial')}
              className="text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
          )}
          <h2 className="text-lg font-semibold flex-1 text-center">
            {isUploading ? 'Uploading post...' :
             step === 'initial' ? 'Create new post' : 
             step === 'preview' ? 'Preview' : 
             'Write a caption'}
          </h2>
          {step !== 'initial' && !isUploading && (
            <button 
             onClick={() => step === 'preview' ? setStep('caption') : handleSubmit()}
             className={`text-blue-500 font-semibold hover:text-blue-600 transition-colors ${
              (step === 'caption' && !caption.trim()) || isUploading ? "opacity-50 cursor-not-allowed" : ""
             }`}
             disabled={isUploading}
            >
             {step === 'preview' ? 'Next' : 'Share'}
            </button>
          )}
        </div>

        {/* Content */}
        {step === 'initial' && (
          <div className="p-8 flex-1 flex flex-col items-center justify-center">
            <div className="flex flex-col items-center justify-center space-y-6 max-w-xs mx-auto w-full">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center shadow-sm">
                <Image size={36} className="text-gray-400" />
              </div>
              <p className="text-xl font-medium text-gray-800">Share your photos</p>
              <div className="space-y-4 w-full">
                <label className="block">
                  <span className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg flex items-center justify-center cursor-pointer hover:bg-blue-600 transition-colors font-medium shadow-sm">
                    <Upload size={18} className="mr-2" />
                    Select from computer
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                <button
                  onClick={handleOpenCamera}
                  className="w-full bg-gray-100 text-gray-800 py-3 px-4 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors font-medium shadow-sm"
                >
                  <Camera size={18} className="mr-2" />
                  Take a photo
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 'preview' && selectedImage && !isUploading && (
          <div className="flex flex-col flex-1">
            <div className="flex-1 p-4 flex items-center justify-center bg-gray-50">
              <img
                src={selectedImage || ''}
                alt="Preview"
                className="max-w-full max-h-[450px] object-contain rounded shadow-sm"
              />
            </div>
          </div>
        )}

        {step === 'caption' && !isUploading && (
          <div className="flex flex-col flex-1">
            {/* Image on top - now sized similar to preview */}
            <div className="flex-1 p-4 flex items-center justify-center bg-gray-50">
              <img
                src={selectedImage || ''}
                alt="Preview"
                className="max-w-full max-h-[400px] object-contain rounded shadow-sm"
              />
            </div>
            {/* Caption box below the image */}
            <div className="p-6 flex flex-col">
              <textarea
                value={caption}
                onChange={(e) => {
                  setCaption(e.target.value);
                  if (e.target.value.trim()) setError(""); // Remove error when user types
                }}
                placeholder="Write a caption..."
                className="w-full resize-none border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm h-24"
              />
              {/* Error Message */}
              {error && (
                <div className="px-4 py-2 bg-red-50 text-red-600 text-sm rounded-lg mt-3 border border-red-100">
                  {error}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Uploading State */}
        {isUploading && (
          <div className="flex flex-col items-center justify-center flex-1 p-8 space-y-6">
            <div className="w-16 h-16 border-4 border-gray-100 border-t-blue-500 rounded-full animate-spin"></div>
            <p className="text-lg text-gray-700 font-medium">Creating your post...</p>
            <p className="text-sm text-gray-500">Please wait while we upload your photo</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InstagramUploadModal;