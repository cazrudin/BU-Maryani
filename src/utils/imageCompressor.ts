/**
 * Helper to compress and convert images selected from phone gallery or captured via camera
 * Ensures mobile photos (often 5-15MB from phone cameras) are compressed into lightweight,
 * high-clarity Web-ready JPEG format (~80-200KB) suitable for instant loading and local/server storage.
 */

export interface CompressedImageResult {
  dataUrl: string;
  width: number;
  height: number;
  sizeKb: number;
  fileName: string;
}

export async function compressImageFile(
  file: File,
  maxDimension: number = 1000,
  quality: number = 0.82
): Promise<CompressedImageResult> {
  if (!file.type.startsWith('image/')) {
    throw new Error('File yang dipilih bukan gambar yang valid.');
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate scaling preserving aspect ratio
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          // Fallback to original data URL if canvas 2D context fails
          const originalDataUrl = event.target?.result as string;
          resolve({
            dataUrl: originalDataUrl,
            width: img.width,
            height: img.height,
            sizeKb: Math.round(file.size / 1024),
            fileName: file.name,
          });
          return;
        }

        // Draw image onto canvas
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to lightweight JPEG
        const dataUrl = canvas.toDataURL('image/jpeg', quality);

        // Approximate size in KB of base64
        const base64Length = dataUrl.length - (dataUrl.indexOf(',') + 1);
        const sizeKb = Math.round((base64Length * 3) / 4 / 1024);

        resolve({
          dataUrl,
          width,
          height,
          sizeKb,
          fileName: file.name,
        });
      };

      img.onerror = () => {
        reject(new Error('Gagal memproses gambar. Pastikan format foto didukung.'));
      };

      img.src = event.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Gagal membaca berkas dari perangkat.'));
    };

    reader.readAsDataURL(file);
  });
}
