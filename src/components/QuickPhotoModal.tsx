import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { ProductPhotoUpload, PresetImage } from './ProductPhotoUpload';
import { Camera, X, Check, ArrowRight } from 'lucide-react';

interface QuickPhotoModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onSavePhoto: (product: Product, newImageUrl: string) => Promise<boolean>;
  presetImages?: PresetImage[];
}

export function QuickPhotoModal({
  product,
  isOpen,
  onClose,
  onSavePhoto,
  presetImages = [],
}: QuickPhotoModalProps) {
  const [currentImage, setCurrentImage] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (product) {
      setCurrentImage(product.image);
      setSavedSuccess(false);
    }
  }, [product]);

  if (!isOpen || !product) return null;

  const handleSave = async () => {
    if (!currentImage || currentImage === product.image) {
      onClose();
      return;
    }

    setIsSaving(true);
    try {
      const ok = await onSavePhoto(product, currentImage);
      if (ok) {
        setSavedSuccess(true);
        setTimeout(() => {
          onClose();
        }, 1200);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanged = currentImage !== product.image;

  return (
    <div className="fixed inset-0 z-70 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-neutral-300 flex flex-col">
        {/* Header */}
        <div className="p-4 bg-linear-to-r from-amber-900 to-amber-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-amber-200">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-sm sm:text-base">Ganti Foto Produk</h4>
              <p className="text-[11px] text-amber-200/90 truncate max-w-xs sm:max-w-sm">
                {product.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 space-y-4">
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-3 text-xs text-amber-950">
            <strong>Petunjuk Foto dari HP:</strong>
            <ul className="list-disc pl-4 mt-1 space-y-0.5 text-[11px] text-neutral-600">
              <li>Tekan <strong>&quot;Foto Langsung (Kamera HP)&quot;</strong> untuk membuka kamera dan memotret produk saat ini juga.</li>
              <li>Tekan <strong>&quot;Pilih dari Galeri HP&quot;</strong> jika foto snack sudah tersimpan di album handphone.</li>
            </ul>
          </div>

          <ProductPhotoUpload
            value={currentImage}
            onChange={(newImg) => setCurrentImage(newImg)}
            presetImages={presetImages}
          />

          {/* Feedback if changed */}
          {hasChanged && (
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Foto baru berhasil dipilih! Klik <strong>Simpan Foto</strong> di bawah untuk menerapkan.</span>
            </div>
          )}

          {savedSuccess && (
            <div className="p-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center justify-center gap-2 animate-bounce">
              <Check className="w-4 h-4" />
              <span>Foto produk berhasil diperbarui!</span>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-3.5 bg-neutral-50 border-t border-neutral-200 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-200 rounded-xl transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            id="btn-save-quick-photo"
            onClick={handleSave}
            disabled={isSaving || !hasChanged}
            className="px-5 py-2.5 bg-amber-700 hover:bg-amber-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            {isSaving ? (
              <span>Menyimpan...</span>
            ) : (
              <>
                <span>Simpan Foto Produk</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
