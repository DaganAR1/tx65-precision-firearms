import { supabase } from './supabase';
import imageCompression from 'browser-image-compression';

export async function uploadImage(file: File, bucket: string = 'images'): Promise<string> {
  // 1. Compress the image
  const options = {
    maxSizeMB: 1, // Max size in MB
    maxWidthOrHeight: 1920, // Max width or height
    useWebWorker: true,
  };

  try {
    const compressedFile = await imageCompression(file, options);
    
    // 2. Generate a unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    // 3. Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, compressedFile);

    if (error) throw error;

    // 4. Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
}
