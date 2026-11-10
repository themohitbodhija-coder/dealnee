import React from 'react';
import Slider from 'react-slick';
import { FaArrowRight } from 'react-icons/fa';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

const CategorySlider = ({ categories }) => {
  const settings = {
    dots: false,
    infinite: false,
    speed: 3000,
    slidesToShow: 5,
    slidesToScroll: 1,
    autoplay: false,
    autoplaySpeed: 0,
    cssEase: 'linear',
    pauseOnHover: true,
    responsive: [
      {
        breakpoint: 1280,
        settings: {
          slidesToShow: 4,
        },
      },
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 3,
        },
      },
      {
        breakpoint: 640,
        settings: {
          slidesToShow: 2,
        },
      },
      {
        breakpoint: 480,
        settings: {
          slidesToShow: 1,
        },
      },
    ],
  };

  return (
    <div className="category-slider-container">
      <style>{`
        .category-slider-container .slick-slide {
          padding: 0 8px;
        }
        
        .category-slider-container .slick-track {
          display: flex;
          gap: 8px;
        }

        .category-slider-container .slick-list {
          overflow-y: hidden !important;
        }
        
        .category-slider-container .slick-prev,
        .category-slider-container .slick-next {
          z-index: 10;
          width: 40px;
          height: 40px;
          top: 50%;
          transform: translateY(-50%);
        }
        
        .category-slider-container .slick-prev {
          left: -60px;
        }
        
        .category-slider-container .slick-next {
          right: -60px;
        }
        
        .category-slider-container .slick-prev:before,
        .category-slider-container .slick-next:before {
          font-size: 24px;
          color: #dc2626;
        }
        
        .category-slider-container .slick-prev:hover:before,
        .category-slider-container .slick-next:hover:before {
          color: #991b1b;
        }

        .category-card {
          height: 240px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
      `}</style>
      
      <Slider {...settings}>
        {categories.map((category) => (
          <div key={category._id} className="px-2">
            <a
              href={`/properties?category=${category._id}`}
              className="category-card group block bg-white rounded-xl shadow-md hover:shadow-xl transition-all border border-gray-200 hover:border-red-300 p-6 text-center transform hover:-translate-y-1 cursor-pointer"
            >
              <div>
                <div className="text-5xl mb-3 group-hover:scale-110 transition transform duration-300 inline-block">
                  {category.icon || '🏠'}
                </div>
                <h3 className="text-base font-bold text-gray-800 mb-2 group-hover:text-red-600 transition line-clamp-2">
                  {category.name}
                </h3>
                <p className="text-gray-600 text-xs leading-relaxed line-clamp-2">
                  {category.description}
                </p>
              </div>
              <div className="mt-3 opacity-0 group-hover:opacity-100 transition">
                <span className="inline-flex items-center text-red-600 font-semibold text-xs">
                  Explore <FaArrowRight className="ml-1" />
                </span>
              </div>
            </a>
          </div>
        ))}
      </Slider>
    </div>
  );
};

export default CategorySlider;
