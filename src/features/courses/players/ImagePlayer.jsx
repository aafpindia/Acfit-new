import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import { Card, CardContent } from '../../../components/ui/card';

export const ImagePlayer = ({ content = {} }) => {
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const mediaObj = typeof content === 'string' ? { images: [content] } : (content || {});
  const images = (Array.isArray(mediaObj.images) && mediaObj.images.length > 0)
    ? mediaObj.images
    : [
        mediaObj.imageUrl || mediaObj.url || mediaObj.fileUrl || mediaObj.src ||
        'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800'
      ];

  return (
    <Card className="border-border overflow-hidden bg-white select-none">
      <CardContent className="p-5 space-y-4">
        {/* Large active viewport */}
        <div className="relative aspect-video bg-gray-50 border border-border rounded-xl overflow-hidden flex items-center justify-center">
          <img src={images[activeImageIdx]} alt="Gallery image" className="w-full h-full object-cover" />
        </div>

        {/* Thumbnail slides selection */}
        <div className="flex gap-3 overflow-x-auto py-1">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setActiveImageIdx(idx)}
              className={`w-20 h-14 rounded-lg overflow-hidden shrink-0 border-2 cursor-pointer transition-all ${
                activeImageIdx === idx ? 'border-primary scale-98 shadow-sm' : 'border-transparent opacity-70 hover:opacity-100'
              }`}
            >
              <img src={img} className="w-full h-full object-cover" alt="Thumbnail" />
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ImagePlayer;
