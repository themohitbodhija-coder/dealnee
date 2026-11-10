import React, { useState, useRef } from 'react';
import { FaSearchPlus, FaSearchMinus, FaDownload, FaTimes, FaAngleLeft, FaAngleRight } from 'react-icons/fa';
import { getImageUrl } from '../../utils/imageUrl';

const ImageLightbox = ({ images, initialIndex = 0, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imageRef = useRef(null);

  const currentImage = images[currentIndex];
  const currentImageSrc = getImageUrl(currentImage) || 'https://via.placeholder.com/1200x800?text=No+Image';
  const maxZoom = 5;
  const minZoom = 1;

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    resetZoom();
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    resetZoom();
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.5, maxZoom));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.5, minZoom));
    if (zoom - 0.5 === minZoom) {
      setPan({ x: 0, y: 0 });
    }
  };

  const resetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleMouseDown = (e) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - pan.x,
        y: e.clientY - pan.y,
      });
    }
  };

  const handleMouseMove = (e) => {
    if (!isDragging || zoom <= 1) return;

    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;

    const maxPanX = (imageRef.current?.width || 0) * (zoom - 1) * 0.5;
    const maxPanY = (imageRef.current?.height || 0) * (zoom - 1) * 0.5;

    setPan({
      x: Math.max(Math.min(newX, maxPanX), -maxPanX),
      y: Math.max(Math.min(newY, maxPanY), -maxPanY),
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(currentImageSrc);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'property-image-' + (currentIndex + 1) + '.jpg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading image:', error);
      alert('Error downloading image');
    }
  };

  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') handlePrevious();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'Escape') onClose();
      if (e.key === '+') handleZoomIn();
      if (e.key === '-') handleZoomOut();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 z-50 flex flex-col items-center justify-center" onClick={onClose} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
      <div className="w-full flex justify-between items-center p-4 bg-black bg-opacity-50">
        <div className="text-white font-semibold">
          {currentIndex + 1} / {images.length}
        </div>
        <button onClick={onClose} className="text-white hover:bg-gray-700 p-2 rounded transition" title="Close">
          <FaTimes size={24} />
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center w-full relative overflow-hidden">
        <img
          ref={imageRef}
          src={currentImageSrc}
          alt="Property"
          className="cursor-move select-none max-w-[90vw] max-h-[80vh] object-contain"
          style={{
          transform: 'scale(' + zoom + ') translate(' + (pan.x / zoom) + 'px, ' + (pan.y / zoom) + 'px)',
          transition: isDragging ? 'none' : 'transform 0.2s ease-out',
          }}
          onMouseDown={handleMouseDown}
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      <div className="w-full flex justify-between items-center p-4 bg-black bg-opacity-50">
        <button onClick={(e) => {
          e.stopPropagation();
          handlePrevious();
        }} className="text-white hover:bg-gray-700 p-2 rounded transition" title="Previous">
          <FaAngleLeft size={24} />
        </button>

        <div className="flex gap-4">
          <button onClick={(e) => {
            e.stopPropagation();
            handleZoomOut();
          }} className="text-white hover:bg-gray-700 p-2 rounded transition disabled:opacity-50" disabled={zoom === minZoom} title="Zoom Out">
            <FaSearchMinus size={20} />
          </button>

          <div className="text-white px-4 py-2 flex items-center min-w-[100px] justify-center">
            {Math.round(zoom * 100)}%
          </div>

          <button onClick={(e) => {
            e.stopPropagation();
            handleZoomIn();
          }} className="text-white hover:bg-gray-700 p-2 rounded transition disabled:opacity-50" disabled={zoom === maxZoom} title="Zoom In">
            <FaSearchPlus size={20} />
          </button>

          <button onClick={(e) => {
            e.stopPropagation();
            handleDownload();
          }} className="text-white hover:bg-gray-700 p-2 rounded transition" title="Download">
            <FaDownload size={20} />
          </button>
        </div>

        <button onClick={(e) => {
          e.stopPropagation();
          handleNext();
        }} className="text-white hover:bg-gray-700 p-2 rounded transition" title="Next">
          <FaAngleRight size={24} />
        </button>
      </div>

      <div className="text-gray-400 text-sm p-2 text-center">
        Keys: Arrow Left/Right, Escape, Drag, Plus/Minus
      </div>
    </div>
  );
};

export default ImageLightbox;
