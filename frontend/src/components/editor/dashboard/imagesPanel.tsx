"use client";

import { useState, useEffect, useRef } from "react";
import { Image as ImageIcon, Upload, Trash2, ExternalLink, Copy, Check, Loader2, Search, RefreshCw } from "lucide-react";
import Image from "next/image";

interface ImageData {
  url: string;
  pathname: string;
  size: number;
  uploadedAt: Date | string;
  fileName: string;
}

export default function ImagesPanel() {
  const [images, setImages] = useState<ImageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedImage, setSelectedImage] = useState<ImageData | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [quota, setQuota] = useState({ current: 0, max: 20, remaining: 20 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/images/list");
      if (!response.ok) {
        throw new Error("Failed to fetch images");
      }

      const data = await response.json();
      if (data.success) {
        setImages(data.images || []);
        setQuota({
          current: data.total || 0,
          max: data.maxImages || 20,
          remaining: data.remainingSlots || 0,
        });
      } else {
        throw new Error(data.error || "Failed to load images");
      }
    } catch (err) {
      console.error("Error fetching images:", err);
      setError(err instanceof Error ? err.message : "Failed to load images");
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    await uploadFile(file);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file");
      return;
    }

    await uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/images/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Upload failed");
      }

      // Refresh images list
      await fetchImages();

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      console.error("Upload error:", err);
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (imageUrl: string) => {
    if (!confirm("Are you sure you want to delete this image?")) {
      return;
    }

    try {
      const response = await fetch("/api/images/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: imageUrl }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Delete failed");
      }

      // Refresh images list
      await fetchImages();
      setSelectedImage(null);
    } catch (err) {
      console.error("Delete error:", err);
      alert(err instanceof Error ? err.message : "Delete failed");
    }
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateString: Date | string): string => {
    const date = typeof dateString === "string" ? new Date(dateString) : dateString;
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  // Filter images
  const filteredImages = images.filter((img) => {
    const searchLower = searchQuery.toLowerCase();
    return !searchQuery || img.fileName.toLowerCase().includes(searchLower);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#0099cc] mx-auto mb-2" />
          <p className="text-sm text-gray-600">Loading images...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      {/* Header with Quota */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-[#0099cc]" />
            Images
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {quota.current} of {quota.max} images used
            {quota.remaining > 0 && (
              <span className="text-green-600 ml-2">({quota.remaining} slots remaining)</span>
            )}
            {quota.remaining === 0 && (
              <span className="text-red-600 ml-2">(Limit reached)</span>
            )}
          </p>
        </div>
        <button
          onClick={fetchImages}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className={`border-2 border-dashed rounded-lg p-6 transition-colors ${
          uploading
            ? "border-blue-400 bg-blue-50"
            : quota.remaining === 0
            ? "border-gray-300 bg-gray-50"
            : "border-gray-300 hover:border-[#0099cc] hover:bg-gray-50"
        }`}
      >
        <div className="text-center">
          {uploading ? (
            <div className="flex flex-col items-center">
              <Loader2 className="w-8 h-8 animate-spin text-[#0099cc] mb-2" />
              <p className="text-sm text-gray-600">Uploading...</p>
            </div>
          ) : (
            <>
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-2">
                Drag and drop an image here, or click to browse
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                disabled={quota.remaining === 0 || uploading}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={quota.remaining === 0 || uploading}
                className="px-4 py-2 bg-[#0099cc] text-white rounded-lg hover:bg-[#0088bb] transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Choose Image
              </button>
              <p className="text-xs text-gray-500 mt-2">
                Max file size: 5MB • Formats: JPG, PNG, GIF, WebP, SVG
              </p>
            </>
          )}
        </div>
      </div>

      {/* Search */}
      {images.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search images..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0099cc] focus:border-transparent text-sm"
          />
        </div>
      )}

      {/* Images Grid */}
      {filteredImages.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600 text-sm">
            {searchQuery ? "No images match your search" : "No images uploaded yet"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredImages.map((img, idx) => (
            <div
              key={idx}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden group cursor-pointer"
            >
              <div
                className="relative aspect-square bg-gray-100"
                onClick={() => setSelectedImage(img)}
              >
                <Image
                  src={img.url}
                  alt={img.fileName}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  unoptimized
                />
              </div>
              <div className="p-3">
                <p className="text-xs font-medium text-gray-900 truncate" title={img.fileName}>
                  {img.fileName}
                </p>
                <p className="text-xs text-gray-500 mt-1">{formatFileSize(img.size)}</p>
                <p className="text-xs text-gray-500">{formatDate(img.uploadedAt)}</p>
                <div className="flex gap-1 mt-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      copyUrl(img.url);
                    }}
                    className="flex-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors flex items-center justify-center gap-1"
                    title="Copy URL"
                  >
                    {copiedUrl === img.url ? (
                      <>
                        <Check className="w-3 h-3" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        Copy
                      </>
                    )}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(img.url);
                    }}
                    className="px-2 py-1 text-xs bg-red-50 text-red-600 hover:bg-red-100 rounded transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Image Preview Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">{selectedImage.fileName}</h3>
              <button
                onClick={() => setSelectedImage(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="p-4">
              <div className="relative w-full aspect-video bg-gray-100 rounded-lg overflow-hidden mb-4">
                <Image
                  src={selectedImage.url}
                  alt={selectedImage.fileName}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 800px"
                  unoptimized
                />
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                <div>
                  <p className="font-semibold text-gray-800">File Size:</p>
                  <p className="text-gray-600">{formatFileSize(selectedImage.size)}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-800">Uploaded:</p>
                  <p className="text-gray-600">{formatDate(selectedImage.uploadedAt)}</p>
                </div>
              </div>
              <div className="mb-4">
                <p className="font-semibold text-gray-800 text-sm mb-1">URL:</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={selectedImage.url}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 font-mono"
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                  />
                  <button
                    onClick={() => copyUrl(selectedImage.url)}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                  >
                    {copiedUrl === selectedImage.url ? (
                      <>
                        <Check className="w-4 h-4" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
              </div>
              <div className="flex gap-2">
                <a
                  href={selectedImage.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-[#0099cc] text-white rounded-lg hover:bg-[#0088bb] transition-colors text-sm font-medium"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open in New Tab
                </a>
                <button
                  onClick={() => handleDelete(selectedImage.url)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors text-sm font-medium"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Image
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
