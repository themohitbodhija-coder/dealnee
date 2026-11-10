import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FaArrowRight } from 'react-icons/fa';

const HeroSection = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoSlide, setIsAutoSlide] = useState(true);
  const [progress, setProgress] = useState(0);
  const autoSlideTimer = useRef(null);
  const progressTimer = useRef(null);
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);
  const isPointerDown = useRef(false);
  const SLIDE_DURATION = 6000; // 6 seconds per slide

  // Hero slides (videos). Place video files in public/images/, e.g. Hero_video1.mp4
  const slides = [
    {
      image: '/images/Hero_video1.mp4',
      poster: '/images/hero-1.jpg',
      title: 'Find Your Dream Home',
      subtitle: 'Discover premium properties with Dealinee estate. Your perfect home awaits.'
    },
    {
      image: '/images/Hero_video2.mp4',
      poster: '/images/hero-2.jpg',
      title: 'Luxury Living Awaits',
      subtitle: 'Explore our exclusive collection of high-end residential properties.'
    },
    {
      image: '/images/Hero_video3.mp4',
      poster: '/images/hero-3.jpg',
      title: 'Invest Wisely',
      subtitle: 'Find the perfect investment property with professional guidance.'
    }
  ];

  // Auto-slide effect
  useEffect(() => {
    if (!isAutoSlide) return;

    // Clear previous timer
    if (autoSlideTimer.current) clearInterval(autoSlideTimer.current);
    if (progressTimer.current) clearInterval(progressTimer.current);

    // Auto-advance slide
    autoSlideTimer.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
      setProgress(0);
    }, SLIDE_DURATION);

    // Progress bar animation
    progressTimer.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 100;
        return prev + (100 / (SLIDE_DURATION / 50));
      });
    }, 50);

    return () => {
      clearInterval(autoSlideTimer.current);
      clearInterval(progressTimer.current);
    };
  }, [isAutoSlide, slides.length]);

  const goToSlide = (index) => {
    setCurrentSlide(index);
    setProgress(0);
    setIsAutoSlide(false);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
    setProgress(0);
    setIsAutoSlide(false);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    setProgress(0);
    setIsAutoSlide(false);
  };

  // Resume auto-slide after manual navigation
  useEffect(() => {
    if (!isAutoSlide) {
      const timer = setTimeout(() => {
        setIsAutoSlide(true);
        setProgress(0);
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [isAutoSlide]);

  // Touch / Pointer handlers for swipe navigation (mobile)
  const handleTouchStart = (e) => {
    if (!e.touches || e.touches.length === 0) return;
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = touchStartX.current;
    setIsAutoSlide(false);
  };

  const handleTouchMove = (e) => {
    if (!e.touches || e.touches.length === 0) return;
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const start = touchStartX.current;
    const end = touchEndX.current;
    if (start == null || end == null) return;
    const delta = start - end;
    const THRESHOLD = 50; // px
    if (Math.abs(delta) > THRESHOLD) {
      if (delta > 0) {
        // swiped left -> next
        setCurrentSlide((prev) => (prev + 1) % slides.length);
      } else {
        // swiped right -> prev
        setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
      }
    }
    // let auto-play resume after a short delay handled by existing effect
  };

  // Pointer events for desktop drag support (optional)
  const handlePointerDown = (e) => {
    isPointerDown.current = true;
    touchStartX.current = e.clientX;
    touchEndX.current = touchStartX.current;
    setIsAutoSlide(false);
  };

  const handlePointerMove = (e) => {
    if (!isPointerDown.current) return;
    touchEndX.current = e.clientX;
  };

  const handlePointerUp = () => {
    if (!isPointerDown.current) return;
    isPointerDown.current = false;
    handleTouchEnd();
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'ArrowLeft') prevSlide();
      if (e.key === 'ArrowRight') nextSlide();
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  return (
    <div className="relative w-full h-screen md:h-[600px] overflow-hidden group bg-black">
      {/* Progress Bar */}
      <div className="absolute top-0 left-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500 z-30 transition-all duration-100"
        style={{ width: `${progress}%` }}
      />

      {/* Carousel Container */}
      <div
        className="relative w-full h-full"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
              index === currentSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
            }`}
          >
            {/* Background: image or video */}
            {slide.image && slide.image.toLowerCase().endsWith('.mp4') ? (
              <video
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 hover:scale-105"
                src={slide.image}
                poster={slide.poster}
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
                onError={(e) => {
                  // hide video if it fails to load to avoid showing a broken element
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 hover:scale-105"
                style={{
                  backgroundImage: `linear-gradient(135deg, rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.3)), url(${slide.image})`,
                  backgroundAttachment: index === currentSlide ? 'fixed' : 'scroll',
                }}
              />
            )}

            {/* Animated Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black opacity-40" />

            {/* Content Overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className={`text-center text-white px-4 z-10 ${
                index === currentSlide ? 'animate-fade-in-up' : ''
              }`}>
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight drop-shadow-lg">
                  {slide.title}
                </h1>
                <p className="text-lg md:text-2xl mb-8 max-w-3xl mx-auto drop-shadow-md text-gray-100">
                  {slide.subtitle}
                </p>

                {/* Quick Filter Buttons */}
                <div className="flex flex-wrap justify-center gap-3 mb-8">
                  <button className="px-4 py-2 bg-white bg-opacity-20 backdrop-blur-sm text-white rounded-full hover:bg-opacity-40 transition duration-300 text-sm font-medium border border-white border-opacity-30 hover:border-opacity-100">
                  
                  </button>
                  <button className="px-4 py-2 bg-white bg-opacity-20 backdrop-blur-sm text-white rounded-full hover:bg-opacity-40 transition duration-300 text-sm font-medium border border-white border-opacity-30 hover:border-opacity-100">
                  
                  </button>
                  <button className="px-4 py-2 bg-white bg-opacity-20 backdrop-blur-sm text-white rounded-full hover:bg-opacity-40 transition duration-300 text-sm font-medium border border-white border-opacity-30 hover:border-opacity-100">
                  
                  </button>
                </div>

                {/* Primary CTA Button (navigates to /properties) */}
                <Link
                  to="/properties"
                  className="inline-flex items-center gap-3 bg-white text-red-600 px-8 py-3 rounded-full hover:bg-gray-100 transition duration-300 font-semibold text-lg transform hover:scale-105"
                >
                  Explore Properties
                  <FaArrowRight />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Previous Button */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20 bg-white bg-opacity-30 hover:bg-opacity-60 backdrop-blur-sm text-white p-3 rounded-full transition duration-300 opacity-0 group-hover:opacity-100 hover:scale-110 border border-white border-opacity-30"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Next Button */}
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20 bg-white bg-opacity-30 hover:bg-opacity-60 backdrop-blur-sm text-white p-3 rounded-full transition duration-300 opacity-0 group-hover:opacity-100 hover:scale-110 border border-white border-opacity-30"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Slide Counter */}
      <div className="absolute top-6 right-6 z-20 bg-white bg-opacity-30 backdrop-blur-sm px-4 py-2 rounded-full text-white font-semibold opacity-0 group-hover:opacity-100 transition duration-300">
        {currentSlide + 1} / {slides.length}
      </div>

      {/* Dots Navigation */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-20 flex gap-2 flex-wrap justify-center">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`rounded-full transition duration-300 ${
              index === currentSlide
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 w-8 h-3'
                : 'bg-white bg-opacity-50 hover:bg-opacity-75 w-3 h-3'
            }`}
            title={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Auto-play indicator */}
      <div className="absolute bottom-6 left-6 z-20 text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition duration-300">
        {isAutoSlide ? '▶ Auto-playing' : '⏸ Manual mode'}
      </div>

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.8s ease-out;
        }
      `}</style>
    </div>
  );
};

export default HeroSection;
