import React, { useState, useEffect, useRef } from 'react';
import Slider from 'react-slick';
import { Link } from 'react-router-dom';
import { propertyService } from '../../services/api';
import HeroSection from '../../components/user/HeroSection';
import Container from '../../components/common/Container';
import { getImageUrl } from '../../utils/imageUrl';
import { getPropertyRoomStats } from '../../utils/propertyFormUtils';

import {
  FaCheckCircle,
  FaUsers,
  FaHome,
  FaAward,
  FaArrowRight,
  FaStar,
  FaMapMarkerAlt,
  FaBed,
  FaBath,
  FaRulerCombined,
  FaHandHoldingUsd,
  FaMoneyBillWave,
  FaGlobeAmericas,
  FaExchangeAlt,
  FaFileContract,
  FaChartLine,
  FaWhatsapp
} from 'react-icons/fa';

import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

// ==================== CONSTANTS ====================
const TESTIMONIALS = [
  {
    id: 1,
    name: 'Rajesh Kumar',
    location: 'Mumbai',
    text: 'Found my dream home within a week! Amazing experience.',
    rating: 5,
    image: 'https://randomuser.me/api/portraits/men/45.jpg'
  },
  {
    id: 2,
    name: 'Priya Singh',
    location: 'Bangalore',
    text: 'Best platform for property search.',
    rating: 5,
    image: 'https://randomuser.me/api/portraits/women/44.jpg'
  },
  {
    id: 3,
    name: 'Amit Patel',
    location: 'Delhi',
    text: 'Sold my property in record time.',
    rating: 5,
    image: 'https://randomuser.me/api/portraits/men/65.jpg'
  }
];

const SERVICES = [
  {
    id: 1,
    icon: FaHandHoldingUsd,
    title: 'Home Buying Consultancy',
    description: 'Expert guidance for property investment'
  },
  {
    id: 2,
    icon: FaMoneyBillWave,
    title: 'Home Loan Assistance',
    description: 'Seamless financing solutions'
  },
  {
    id: 3,
    icon: FaGlobeAmericas,
    title: 'NRI Consulting',
    description: 'Support for overseas investors'
  },
  {
    id: 4,
    icon: FaExchangeAlt,
    title: 'Resale Services',
    description: 'Maximize returns on sale'
  },
  {
    id: 5,
    icon: FaFileContract,
    title: 'Legal Assistance',
    description: 'Documentation & compliance'
  },
  {
    id: 6,
    icon: FaChartLine,
    title: 'Investment Consultancy',
    description: 'Strategic investment planning'
  }
];

const CERTIFICATES = [
  { id: 1, name: 'BMC', image: '/images/bmc.png' },
  { id: 2, name: 'CMC', image: '/images/cmc.png' },
  { id: 3, name: 'BDA', image: '/images/bda-1.png' },
  { id: 4, name: 'RERA', image: '/images/rera-1.png' },
  { id: 5, name: 'ORERA', image: '/images/orera-1.png' }
];

const DEVELOPERS = [
  { id: 1, image: '/images/dev1.png' },
  { id: 2, image: '/images/dev2.png' },
  { id: 3, image: '/images/dev3.png' },
  { id: 4, image: '/images/dev4.png' },
  { id: 5, image: '/images/dev5.png' },
  { id: 6, image: '/images/dev6.png' },
];

// ==================== SLIDER SETTINGS ====================
const FEATURED_SLIDER_SETTINGS = {
  dots: true,
  infinite: true,
  speed: 800,
  slidesToShow: 4,
  slidesToScroll: 1,
  autoplay: true,
  autoplaySpeed: 5000,
  swipe: true,
  touchMove: true,
  swipeToSlide: true,
  responsive: [
    { breakpoint: 1024, settings: { slidesToShow: 3 } },
    { breakpoint: 768, settings: { slidesToShow: 2 } },
    { breakpoint: 640, settings: { slidesToShow: 1 } }
  ]
};

const DEVELOPER_SLIDER_SETTINGS = {
  dots: false,
  infinite: true,
  speed: 4000,
  slidesToShow: 5,
  slidesToScroll: 1,
  autoplay: true,
  autoplaySpeed: 0,
  cssEase: 'linear',
  arrows: false,
  responsive: [
    { breakpoint: 1024, settings: { slidesToShow: 3 } },
    { breakpoint: 768, settings: { slidesToShow: 2 } }
  ]
};

const CERTIFICATES_SLIDER_SETTINGS = {
  dots: false,
  infinite: true,

  // IMPORTANT
  speed: 8000,

  slidesToShow: 5,
  slidesToScroll: 1,

  autoplay: true,
  autoplaySpeed: 0,

  cssEase: "linear",

  arrows: false,


  
  pauseOnHover: true,

  draggable: false,
  swipe: false,
  touchMove: false,

  responsive: [
    {
      breakpoint: 1024,
      settings: {
        slidesToShow: 3
      }
    },
    {
      breakpoint: 768,
      settings: {
        slidesToShow: 2
      }
    },
    {
      breakpoint: 640,
      settings: {
        slidesToShow: 1
      }
    }
  ]
};
// ==================== SUB-COMPONENTS ====================

// Horizontal Auto-Scrolling Container Component

const HorizontalScrollContainer = ({ children }) => {
  const scrollContainerRef = React.useRef(null);
  const [isAutoScroll, setIsAutoScroll] = useState(true);
  const resumeTimerRef = React.useRef(null);

  useEffect(() => {
    if (!scrollContainerRef.current || !isAutoScroll) return;

    const scrollContainer = scrollContainerRef.current;
    let scrollAmount = 0;
    const scrollSpeed = 1;
    const maxScroll = scrollContainer.scrollWidth - scrollContainer.clientWidth;

    const autoScroll = setInterval(() => {
      if (scrollAmount >= maxScroll) {
        scrollAmount = 0;
      }
      scrollAmount += scrollSpeed;
      scrollContainer.scrollLeft = scrollAmount;
    }, 30);

    return () => clearInterval(autoScroll);
  }, [isAutoScroll]);

  useEffect(() => {
    return () => {
      if (resumeTimerRef.current) {
        clearTimeout(resumeTimerRef.current);
      }
    };
  }, []);

  const pauseAutoScroll = () => {
    if (resumeTimerRef.current) {
      clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = null;
    }
    setIsAutoScroll(false);
  };

  const resumeAutoScroll = () => {
    if (resumeTimerRef.current) {
      clearTimeout(resumeTimerRef.current);
    }

    resumeTimerRef.current = setTimeout(() => {
      setIsAutoScroll(true);
      resumeTimerRef.current = null;
    }, 2500);
  };

  return (
    <div
      ref={scrollContainerRef}
      onMouseEnter={pauseAutoScroll}
      onMouseLeave={resumeAutoScroll}
      onTouchStart={pauseAutoScroll}
      onTouchEnd={resumeAutoScroll}
      onTouchCancel={resumeAutoScroll}
      className="flex flex-nowrap gap-6 overflow-x-auto scroll-smooth px-4 pb-4 snap-x snap-mandatory"
      style={{
        scrollBehavior: 'smooth',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}
    >
      <style>{`
        div:has(> div.flex-shrink-0)::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      {children}
    </div>
  );
};

// Property Card Component
const formatPrice = (price) => {
  const raw = price;
  const n = Number(raw);

  if (!Number.isFinite(n) || n <= 0) return 'N/A';

  return n.toLocaleString('en-IN');
};

const getFeaturedCardPrice = (property) => {
  const rentalPrice = property.rentalInfo?.monthlyRent;
  const price = Number(property.price);

  if (Number.isFinite(rentalPrice) && rentalPrice > 0) {
    return formatPrice(rentalPrice);
  }

  if (Number.isFinite(price) && price > 0) {
    return formatPrice(price);
  }

  return 'N/A';
};

const PropertyCardItem = ({ property }) => {
  const roomStats = getPropertyRoomStats(property);
  const bedrooms = roomStats.bedrooms;
  const bathrooms = roomStats.bathrooms;

  return (
    <div className="shrink-0 w-80 snap-start">
      <Link
        to={`/property/${property._id}`}
        className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition duration-300 block h-full"
      >
        <div className="relative h-56 overflow-hidden">
          <img
            src={getImageUrl(property.images?.[0]) || 'https://via.placeholder.com/400x300'}
            alt={property.title}
            className="w-full h-full object-cover hover:scale-110 transition duration-500"
          />
          <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold">
            Featured
          </div>
        </div>

        <div className="p-5">
          <h3 className="text-xl font-bold text-gray-800 mb-2 line-clamp-2">
            {property.title}
          </h3>
  <p className="text-xs font-semibold text-red-600 mb-2">
            Property ID: {property.propertyId || 'N/A'}
          </p>
          <p className="flex items-center gap-2 text-gray-600 mb-3 text-sm">
            <FaMapMarkerAlt className="text-red-500 flex-shrink-0" />
            <span className="line-clamp-1">
              {typeof property.location === 'object'
                ? `${property.location?.city}, ${property.location?.state}`
                : property.location}
            </span>
          </p>

            <p className="text-2xl font-bold text-red-500 mb-4">
            ₹{getFeaturedCardPrice(property)}
          </p>


          <div className="grid grid-cols-3 gap-3 text-center text-sm">
            {typeof bedrooms === 'number' && !Number.isNaN(bedrooms) && bedrooms > 0 && (
              <div>
                <FaBed className="mx-auto text-red-500 mb-1" />
                <p className="font-semibold">{bedrooms}</p>
              </div>
            )}
            {typeof bathrooms === 'number' && !Number.isNaN(bathrooms) && bathrooms > 0 && (
              <div>
                <FaBath className="mx-auto text-blue-500 mb-1" />
                <p className="font-semibold">{bathrooms}</p>
              </div>
            )}
            <div>
              <FaRulerCombined className="mx-auto text-amber-500 mb-1" />
              <p className="font-semibold">{property.area}</p>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};

// ...existing code...

// Service Card Component
const ServiceCard = ({ service }) => {
  const Icon = service.icon;
  return (
    <div className="bg-white rounded-2xl p-6 shadow-md hover:shadow-2xl transition duration-300 text-center hover:-translate-y-2">
      <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
        <Icon className="text-3xl text-red-500" />
      </div>
      <h3 className="font-bold text-gray-800 mb-2">{service.title}</h3>
      <p className="text-sm text-gray-600">{service.description}</p>
    </div>
  );
};

// Certificate Card Component
const CertificateCard = ({ certificate }) => (
  <div className="flex items-center justify-center px-3">
    <img
      src={certificate.image}
      alt={certificate.name}
      className="w-32 h-32 rounded-full object-cover shadow-lg hover:shadow-2xl transition duration-300 hover:scale-110"
    />
  </div>
);

// Developer Card Component
const DeveloperCard = ({ developer }) => (
  <div className="px-3">
    <div className="bg-white rounded-3xl p-10 h-48 flex items-center justify-center shadow-lg hover:shadow-xl transition">
      <img src={developer.image} alt="Developer" className="h-24 object-contain" />
    </div>
  </div>
);

// Testimonial Card Component
const TestimonialCard = ({ testimonial }) => (
  <div className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition duration-300 border border-gray-100">
    <div className="flex items-center gap-4 mb-6">
      <div className="w-16 h-16 rounded-full overflow-hidden ring-4 ring-red-100 shadow-md flex-shrink-0 bg-gray-100">
        <img
          src={testimonial.image}
          alt={testimonial.name}
          className="w-full h-full object-cover"
        />
      </div>
      <div>
        <h4 className="font-bold text-gray-900 text-lg">{testimonial.name}</h4>
        <p className="text-sm text-gray-500">{testimonial.location}</p>
      </div>
    </div>

    <div className="flex mb-5">
      {[...Array(testimonial.rating)].map((_, i) => (
        <FaStar key={i} className="text-yellow-400 mr-1" />
      ))}
    </div>

    <p className="text-gray-600 italic leading-relaxed">"{testimonial.text}"</p>
  </div>
);

// ==================== MAIN COMPONENT ====================
const HomePage = () => {
  const [featuredProperties, setFeaturedProperties] = useState([]);

  // ==================== HOOKS ====================
  useEffect(() => {
    fetchFeaturedProperties();
  }, []);

  // ==================== API CALLS ====================
  const fetchFeaturedProperties = async () => {
    try {
      const response = await propertyService.getFeatured();
      const incoming = response.data.properties || [];

      console.log(
        'getFeatured() sample price payload:',
        (incoming || []).slice(0, 5).map((p) => ({
          _id: p?._id,
          price: p?.price,
          priceType: typeof p?.price
        }))
      );

      // Dedupe to prevent the same featured property rendering twice
      // (based on _id and then fallback to propertyId if present)
      // Dedupe by _id first (most reliable). If _id is missing, fallback to propertyId.
      // Also, if neither exists, keep the item.
      const seenIds = new Set();
      const seenPropertyIds = new Set();

      const deduped = incoming.filter((p) => {
        const id = p?._id?.toString();
        const propertyId = p?.propertyId?.toString();

        if (id) {
          if (seenIds.has(id)) return false;
          seenIds.add(id);
          return true;
        }

        if (propertyId) {
          if (seenPropertyIds.has(propertyId)) return false;
          seenPropertyIds.add(propertyId);
          return true;
        }

        return true;
      });

      setFeaturedProperties(deduped);
    } catch (error) {
      console.error('Error fetching featured properties:', error);
      setFeaturedProperties([]);
    }
  };

  // ==================== RENDER ====================
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <HeroSection />

      {/* Featured Properties Section - Auto Scrolling Carousel */}
      <section className="py-20 bg-gradient-to-b from-slate-900 to-slate-800">
        <Container>
          <div className="text-center mb-14">
            <h2 className="text-5xl font-bold text-white mb-4">Featured Properties</h2>
            <p className="text-slate-300 text-lg">Explore our premium property collection</p>
          </div>

          <HorizontalScrollContainer>
            {featuredProperties.map((property) => (
              <PropertyCardItem key={property._id || property.propertyId} property={property} />
            ))}
          </HorizontalScrollContainer>
        </Container>
      </section>

      {/* Services Section */}
      <section className="py-20 bg-gray-50">
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-gray-900 mb-4">Our Services</h2>
            <p className="text-gray-600 text-lg">Complete real estate solutions</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {SERVICES.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        </Container>
      </section>

      {/* Certificates Section */}
      <section className="py-16 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-12">
            <p className="text-red-600 font-semibold text-sm uppercase tracking-widest mb-2">
              Certificates & Approvals
            </p>
            <h2 className="text-4xl font-black text-gray-900">
              100% Verified & Trusted Properties
            </h2>
          </div>

          <Slider {...CERTIFICATES_SLIDER_SETTINGS}>
            {CERTIFICATES.map((cert) => (
              <CertificateCard key={cert.id} certificate={cert} />
            ))}
          </Slider>
        </div>
      </section>

      {/* ORERA Registration Section */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-3xl shadow-xl border border-red-100 p-12 text-center">
            <p className="text-red-600 font-semibold text-sm uppercase tracking-widest mb-3">
              Our Association
            </p>
            <h2 className="text-4xl font-black text-gray-900 mb-8">Registered With ORERA</h2>

            <div className="w-40 h-40 mx-auto rounded-full bg-gray-50 shadow-lg flex items-center justify-center mb-6">
              <img src="/images/orera-1.png" alt="ORERA" className="w-32 h-32 object-contain" />
            </div>

            <p className="text-gray-700 font-semibold text-lg">RERA NO. ORA/0308/2025</p>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-20 bg-gradient-to-r from-black to-red-500 text-white">
        <Container>
          <div className="text-center mb-14">
            <h2 className="text-5xl font-bold mb-4">Why Choose Dealinee</h2>
            <p className="text-red-100 text-lg">Trusted by thousands of customers</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white/10 rounded-2xl p-8 text-center backdrop-blur hover:bg-white/20 transition duration-300">
              <FaHome className="text-5xl mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">10K+ Properties</h3>
              <p>Largest property database</p>
            </div>

            <div className="bg-white/10 rounded-2xl p-8 text-center backdrop-blur hover:bg-white/20 transition duration-300">
              <FaUsers className="text-5xl mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">100K+ Users</h3>
              <p>Trusted by thousands</p>
            </div>

            <div className="bg-white/10 rounded-2xl p-8 text-center backdrop-blur hover:bg-white/20 transition duration-300">
              <FaAward className="text-5xl mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">Award Winning</h3>
              <p>Industry leaders</p>
            </div>

            <div className="bg-white/10 rounded-2xl p-8 text-center backdrop-blur hover:bg-white/20 transition duration-300">
              <FaCheckCircle className="text-5xl mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">24/7 Support</h3>
              <p>Always here to help</p>
            </div>
          </div>
        </Container>
      </section>

      {/* Featured Developers Section - Auto Scrolling Carousel */}
      <section className="py-24 bg-gradient-to-br from-slate-900 to-black overflow-hidden">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <p className="text-red-500 font-semibold text-sm uppercase tracking-widest mb-3">
              Trusted Partners
            </p>
            <h2 className="text-5xl font-black text-white mb-4">Featured Developers</h2>
            <p className="text-gray-300 text-lg">India's leading real estate developers</p>
          </div>

          <Slider {...DEVELOPER_SLIDER_SETTINGS}>
            {DEVELOPERS.map((developer) => (
              <DeveloperCard key={developer.id} developer={developer} />
            ))}
          </Slider>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gray-50">
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-gray-900 mb-4">Customer Success Stories</h2>
            <p className="text-gray-600 text-lg">Hear from our happy customers</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {TESTIMONIALS.map((testimonial) => (
              <TestimonialCard key={testimonial.id} testimonial={testimonial} />
            ))}
          </div>
        </Container>
      </section>

      {/* Call to Action Section */}
      <section className="py-20 bg-gradient-to-r from-black to-red-500 text-white">
        <Container className="text-center">
          <h2 className="text-5xl font-bold mb-6">Ready to Find Your Dream Property?</h2>
          <p className="text-xl mb-8 text-red-100">Start your property search today</p>

          <Link
            to="/properties"
            className="inline-flex items-center gap-3 bg-white text-red-600 px-8 py-4 rounded-xl font-bold hover:bg-gray-100 transition duration-300"
          >
            Explore Properties
            <FaArrowRight />
          </Link>
        </Container>
      </section>

      {/* WhatsApp Floating Button */}
      <a
        href="https://wa.me/919776631999"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 bg-green-500 hover:bg-green-600 text-white rounded-full p-4 shadow-lg z-50 transition duration-300"
        title="Contact us on WhatsApp"
      >
        <FaWhatsapp className="text-3xl" />
      </a>
    </div>
  );
};

export default HomePage;
