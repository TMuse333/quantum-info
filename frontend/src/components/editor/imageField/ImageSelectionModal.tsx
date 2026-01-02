'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Image as ImageIcon, Loader2 } from 'lucide-react';
import axios from 'axios';
import { useUserAccountStore } from '@/stores/account';

interface ImageSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectImage: (url: string) => void;
  onUploadNew: (file: File) => Promise<void>;
  currentImageUrl?: string;
}

interface UserImage {
  url: string;
  pathname: string;
  size: number;
  uploadedAt: Date;
}

export function ImageSelectionModal({
  isOpen,
  onClose,
  onSelectImage,
  onUploadNew,
  currentImageUrl
}: ImageSelectionModalProps) {
  const { user } = useUserAccountStore();
  const [images, setImages] = useState<UserImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [imageCount, setImageCount] = useState(0);
  const [canUpload, setCanUpload] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'gallery' | 'upload'>('gallery');
  const [dragActive, setDragActive] = useState(false);

  // Fetch user images
  useEffect(() => {
    if (isOpen) {
      fetchUserImages();
    }
  }, [isOpen]);

  const fetchUserImages = async () => {
    setLoading(true);
    try {
      // Use new Vercel Blob images API (no userId needed - uses USER_EMAIL from env)
      const res = await axios.get('/api/images/list');
      if (res.data?.success) {
        setImages(res.data.images || []);
        setImageCount(res.data.total || 0);
        setCanUpload(res.data.canUpload || false);
      }
    } catch (error) {
      console.error('Error fetching images:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectImage = (url: string) => {
    onSelectImage(url);
    onClose();
  };

  const handleFileSelect = async (file: File) => {
    if (!canUpload) {
      alert('You have reached the maximum of 20 images. Please delete some images before uploading new ones.');
      return;
    }

    setUploading(true);
    try {
      await onUploadNew(file);
      // Refresh the gallery after upload
      await fetchUserImages();
      setActiveTab('gallery');
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">Select Image</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('gallery')}
              className={`flex-1 px-6 py-3 font-semibold transition-colors ${
                activeTab === 'gallery'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <ImageIcon className="w-5 h-5" />
                <span>My Images ({imageCount}/20)</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              disabled={!canUpload}
              className={`flex-1 px-6 py-3 font-semibold transition-colors ${
                activeTab === 'upload'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : canUpload
                  ? 'text-gray-600 hover:text-gray-900'
                  : 'text-gray-400 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Upload className="w-5 h-5" />
                <span>Upload New {!canUpload && '(Limit Reached)'}</span>
              </div>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'gallery' ? (
              <div>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  </div>
                ) : images.length === 0 ? (
                  <div className="text-center py-12">
                    <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">No images uploaded yet</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Upload your first image to get started
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {images.map((img, index) => (
                      <motion.button
                        key={index}
                        onClick={() => handleSelectImage(img.url)}
                        className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                          currentImageUrl === img.url
                            ? 'border-blue-600 ring-2 ring-blue-200'
                            : 'border-gray-200 hover:border-blue-400'
                        }`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <img
                          src={img.url}
                          alt={`Image ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {currentImageUrl === img.url && (
                          <div className="absolute inset-0 bg-blue-600/20 flex items-center justify-center">
                            <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-semibold">
                              Current
                            </span>
                          </div>
                        )}
                      </motion.button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div>
                {!canUpload ? (
                  <div className="text-center py-12">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                      <p className="text-yellow-800 font-semibold mb-2">
                        Image Limit Reached
                      </p>
                      <p className="text-yellow-700 text-sm">
                        You have uploaded the maximum of 20 images. Please delete some images from your gallery before uploading new ones.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                      dragActive
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {uploading ? (
                      <div className="flex flex-col items-center gap-4">
                        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
                        <p className="text-gray-600">Uploading image...</p>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-lg font-semibold text-gray-900 mb-2">
                          Drag and drop an image here
                        </p>
                        <p className="text-gray-600 mb-4">or</p>
                        <label className="inline-block">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileInput}
                            className="hidden"
                          />
                          <span className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors cursor-pointer inline-block">
                            Browse Files
                          </span>
                        </label>
                        <p className="text-sm text-gray-500 mt-4">
                          Supported formats: JPG, PNG, GIF, WEBP
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                          Remaining slots: {20 - imageCount}
                        </p>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

