import React, { useRef } from 'react';
import { Camera, Image as ImageIcon } from 'lucide-react';

interface ImagePickerProps {
  onImageSelect: (image: string) => void;
  className?: string;
}

export const ImagePicker: React.FC<ImagePickerProps> = ({ onImageSelect, className = "" }) => {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onImageSelect(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
    // Reset input so the same file can be selected again
    e.target.value = '';
  };

  return (
    <div className={`flex gap-2 ${className}`}>
      <button
        type="button"
        onClick={() => cameraInputRef.current?.click()}
        className="flex-1 py-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-100 transition-all active:scale-95 border border-blue-100 dark:border-blue-800/30"
      >
        <Camera size={20} />
        <span className="text-sm">Camera</span>
      </button>
      
      <button
        type="button"
        onClick={() => galleryInputRef.current?.click()}
        className="flex-1 py-3 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-purple-100 transition-all active:scale-95 border border-purple-100 dark:border-purple-800/30"
      >
        <ImageIcon size={20} />
        <span className="text-sm">Gallery</span>
      </button>

      {/* Hidden inputs */}
      <input
        type="file"
        ref={cameraInputRef}
        onChange={handleFileChange}
        accept="image/*"
        capture="environment"
        className="hidden"
      />
      <input
        type="file"
        ref={galleryInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
    </div>
  );
};
