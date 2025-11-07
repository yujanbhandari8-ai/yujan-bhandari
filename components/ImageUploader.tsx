
import React, { useState, useRef, useCallback } from 'react';
import { UploadIcon } from './icons';
import { ImageFile } from '../types';

interface ImageUploaderProps {
  id: string;
  title: string;
  onImageUpload: (file: ImageFile | null) => void;
}

// Define the component outside of the parent to prevent re-creation on re-renders
const ImageUploader: React.FC<ImageUploaderProps> = ({ id, title, onImageUpload }) => {
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fileToBase64 = (file: File): Promise<ImageFile> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve({ base64, mimeType: file.type });
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const imageFile = await fileToBase64(file);
        setPreview(URL.createObjectURL(file));
        onImageUpload(imageFile);
      } catch (error) {
        console.error("Error reading file:", error);
        onImageUpload(null);
        setPreview(null);
      }
    } else {
        onImageUpload(null);
        setPreview(null);
    }
  }, [onImageUpload]);

  const handleDrop = useCallback((event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer.files && event.dataTransfer.files[0]) {
      const file = event.dataTransfer.files[0];
      if (fileInputRef.current) {
          // This is a bit of a trick to make the input element aware of the dropped file
          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(file);
          fileInputRef.current.files = dataTransfer.files;
          
          // Manually trigger the change event
          const changeEvent = new Event('change', { bubbles: true });
          fileInputRef.current.dispatchEvent(changeEvent);
      }
    }
  }, []);

  const handleDragOver = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">{title}</h3>
      <label
        htmlFor={id}
        className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-bray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600 transition-colors duration-300"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        {preview ? (
          <img src={preview} alt="Image preview" className="w-full h-full object-cover rounded-lg" />
        ) : (
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <UploadIcon />
            <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
              <span className="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">PNG, JPG, or WEBP</p>
          </div>
        )}
        <input id={id} type="file" ref={fileInputRef} className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleFileChange} />
      </label>
    </div>
  );
};

export default ImageUploader;
