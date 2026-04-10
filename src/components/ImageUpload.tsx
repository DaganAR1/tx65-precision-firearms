import React, { useState, useRef } from 'react';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { uploadImage } from '../lib/storage';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import { OptimizedImage } from './OptimizedImage';

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  className?: string;
  label?: string;
}

export default function ImageUpload({ value, onChange, className, label }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Basic validation
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    setUploading(true);
    try {
      const url = await uploadImage(file);
      onChange(url);
      toast.success('Image uploaded and optimized');
    } catch (error: any) {
      toast.error('Failed to upload image: ' + error.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = () => {
    onChange('');
  };

  return (
    <div className={cn("space-y-4", className)}>
      {label && (
        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
          {label}
        </label>
      )}
      
      <div className="relative group">
        {value ? (
          <div className="relative aspect-video bg-gray-100 border border-gray-200 overflow-hidden group">
            <OptimizedImage 
              src={value} 
              alt="Uploaded" 
              containerClassName="w-full h-full"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 bg-white text-black hover:bg-brand-accent hover:text-white transition-colors"
                title="Change Image"
              >
                <Upload size={18} />
              </button>
              <button
                type="button"
                onClick={removeImage}
                className="p-2 bg-white text-black hover:bg-red-600 hover:text-white transition-colors"
                title="Remove Image"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full aspect-video border-2 border-dashed border-gray-200 hover:border-brand-accent hover:bg-brand-muted transition-all flex flex-col items-center justify-center space-y-2 group"
          >
            {uploading ? (
              <Loader2 className="animate-spin text-brand-accent" size={32} />
            ) : (
              <>
                <div className="p-3 bg-gray-50 rounded-full group-hover:bg-white transition-colors">
                  <Upload className="text-gray-400 group-hover:text-brand-accent" size={24} />
                </div>
                <div className="text-center">
                  <p className="text-xs font-black uppercase tracking-widest text-gray-600">Click to upload</p>
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">PNG, JPG, WEBP up to 10MB</p>
                </div>
              </>
            )}
          </button>
        )}
        
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />
      </div>
      
      {/* Optional: Keep URL input as fallback or for external images */}
      <div className="flex items-center space-x-2 pt-2">
        <div className="h-[1px] flex-1 bg-gray-100"></div>
        <span className="text-[8px] font-black uppercase tracking-widest text-gray-300">OR</span>
        <div className="h-[1px] flex-1 bg-gray-100"></div>
      </div>
      
      <div className="space-y-2">
        <label className="text-[8px] font-black uppercase tracking-widest text-gray-300">External Image URL</label>
        <div className="relative">
          <input
            type="url"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="input-field text-xs py-2 pl-8"
            placeholder="https://example.com/image.jpg"
          />
          <ImageIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-300" size={14} />
        </div>
      </div>
    </div>
  );
}
