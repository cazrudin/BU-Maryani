import React, { useState, useRef } from 'react';
import { Camera, Image as ImageIcon, Upload, Link as LinkIcon, RefreshCw, Check, AlertCircle } from 'lucide-react';
import { compressImageFile, CompressedImageResult } from '../utils/imageCompressor';

export interface PresetImage {
  label: string;
  url: string;
}

interface ProductPhotoUploadProps {
  value: string;
  onChange: (imageUrl: string) => void;
  presetImages?: PresetImage[];
  compact?: boolean;
}

export function ProductPhotoUpload({
  value,
  onChange,
  presetImages = [],
  compact = false,
}: ProductPhotoUploadProps) {
  const [activeMode, setActiveMode] = useState<'upload' | 'url' | 'presets'>('upload');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [lastCompressedInfo, setLastCompressedInfo] = useState<CompressedImageResult | null>(null);

  // Separate hidden file inputs: one for direct camera snap, one for gallery picker
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, source: 'camera' | 'gallery') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setErrorMessage('');

    try {
      // Compress and resize image
      const result = await compressImageFile(file, 1000, 0.82);
      setLastCompressedInfo(result);
      onChange(result.dataUrl);
    } catch (err: unknown) {
      console.error('Failed to process image:', err);
      const msg = err instanceof Error ? err.message : 'Gagal memproses foto';
      setErrorMessage(msg);
    } finally {
      setIsProcessing(false);
      // Reset input value so user can re-select the same file if needed
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-3">
      {/* Hidden File Inputs for Mobile Browser */}
      {/* 1. Direct Camera Capture for Phones (capture="environment" uses the back camera) */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFileChange(e, 'camera')}
      />

      {/* 2. Photo Gallery Picker for Phones & Computer */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFileChange(e, 'gallery')}
      />

      {/* Top Preview & Mode Switcher */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        {/* Preview Thumbnail */}
        <div className="relative group shrink-0 w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-neutral-100 border-2 border-dashed border-neutral-300 flex items-center justify-center">
          {value ? (
            <img
              src={value}
              alt="Preview Foto Produk"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-center p-2 text-neutral-400">
              <ImageIcon className="w-8 h-8 mx-auto mb-1 opacity-50" />
              <span className="text-[10px] block font-medium">Belum Ada Foto</span>
            </div>
          )}

          {isProcessing && (
            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white p-1 text-center">
              <RefreshCw className="w-5 h-5 animate-spin text-amber-300 mb-1" />
              <span className="text-[10px] font-bold">Mengompres Foto...</span>
            </div>
          )}
        </div>

        {/* Action Buttons for Mobile Phone */}
        <div className="flex-1 space-y-2 w-full">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
              <span>Pilihan Ganti Foto Produk</span>
              {lastCompressedInfo && (
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  {lastCompressedInfo.sizeKb} KB
                </span>
              )}
            </span>

            {/* Mode Tabs */}
            <div className="flex items-center gap-1 text-[11px]">
              <button
                type="button"
                onClick={() => setActiveMode('upload')}
                className={`px-2 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                  activeMode === 'upload'
                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                    : 'text-neutral-500 hover:text-neutral-800'
                }`}
              >
                Kamera & Galeri
              </button>
              <button
                type="button"
                onClick={() => setActiveMode('presets')}
                className={`px-2 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                  activeMode === 'presets'
                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                    : 'text-neutral-500 hover:text-neutral-800'
                }`}
              >
                Preset
              </button>
              <button
                type="button"
                onClick={() => setActiveMode('url')}
                className={`px-2 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                  activeMode === 'url'
                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                    : 'text-neutral-500 hover:text-neutral-800'
                }`}
              >
                URL Link
              </button>
            </div>
          </div>

          {/* Mode 1: Mobile Camera & Gallery Buttons */}
          {activeMode === 'upload' && (
            <div className="space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* 1. Button Foto Langsung (Kamera HP) */}
                <button
                  type="button"
                  id="btn-photo-camera"
                  disabled={isProcessing}
                  onClick={() => cameraInputRef.current?.click()}
                  className="py-2.5 px-3 bg-amber-700 hover:bg-amber-800 active:scale-98 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  <Camera className="w-4 h-4 text-amber-200 shrink-0" />
                  <span>Foto Langsung (Kamera HP)</span>
                </button>

                {/* 2. Button Pilih dari Galeri HP */}
                <button
                  type="button"
                  id="btn-photo-gallery"
                  disabled={isProcessing}
                  onClick={() => galleryInputRef.current?.click()}
                  className="py-2.5 px-3 bg-emerald-700 hover:bg-emerald-800 active:scale-98 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  <ImageIcon className="w-4 h-4 text-emerald-200 shrink-0" />
                  <span>Pilih dari Galeri HP</span>
                </button>
              </div>
            </div>
          )}

          {/* Mode 2: Preset Snack Images */}
          {activeMode === 'presets' && presetImages.length > 0 && (
            <div className="space-y-1.5">
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 max-h-36 overflow-y-auto p-1 bg-neutral-50 rounded-xl border border-neutral-200">
                {presetImages.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      onChange(preset.url);
                      setLastCompressedInfo(null);
                    }}
                    className={`p-1 text-[10px] text-left rounded-lg border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      value === preset.url
                        ? 'border-amber-600 bg-amber-50 font-bold text-amber-900 ring-2 ring-amber-400'
                        : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-100'
                    }`}
                  >
                    <img
                      src={preset.url}
                      alt={preset.label}
                      className="w-full h-10 object-cover rounded-md"
                    />
                    <span className="truncate w-full text-center">{preset.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Mode 3: Manual URL Link Input */}
          {activeMode === 'url' && (
            <div className="space-y-1.5">
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/... atau link foto online"
                  value={value.startsWith('data:') ? '' : value}
                  onChange={(e) => {
                    onChange(e.target.value);
                    setLastCompressedInfo(null);
                  }}
                  className="flex-1 px-3 py-2 text-xs border border-neutral-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>
              <span className="text-[11px] text-neutral-400 block">
                Masukkan tautan gambar web eksternal yang dapat diakses publik.
              </span>
            </div>
          )}

          {/* Error message */}
          {errorMessage && (
            <div className="p-2 bg-rose-50 border border-rose-200 rounded-xl text-[11px] text-rose-700 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
