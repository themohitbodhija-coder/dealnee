import React from 'react';
import {
  FaHandshake,
  FaFileContract,
  FaChartLine,
  FaBullseye,
  FaLightbulb,
  FaUsers,
  FaAward,
  FaHome,
  FaArrowRight
} from 'react-icons/fa';

import { Link } from 'react-router-dom';

function AboutPage() {

  const features = [
    {
      id: 1,
      icon: FaHandshake,
      title: 'Easy Home Buying',
      description:
        'We make your property search simple with expert guidance at every step.'
    },
    {
      id: 2,
      icon: FaFileContract,
      title: 'Legal Assistance',
      description:
        'Complete transparency and security in all your transactions.'
    },
    {
      id: 3,
      icon: FaChartLine,
      title: 'Smooth Documentation',
      description:
        'Hassle-free paperwork support from our expert team.'
    }
  ];

  const stats = [
    {
      id: 1,
      number: '6+',
      title: 'Years Experience',
      description: 'Hands-on experience in the property industry'
    },
    {
      id: 2,
      number: '20+',
      title: 'Team Members',
      description: 'Dedicated professionals'
    },
    {
      id: 3,
      number: '1,000+',
      title: 'Happy Customers',
      description: 'Satisfied families'
    }
  ];

  const teamMembers = [
    {
      id: 1,
      name: 'Niharika Sahoo',
      role: 'Manager',
      image: '/images/emp2.jpg',
      color: 'green'
      
    },
    {
      id: 2,
      name: 'Mousumi praharaj',
      role: 'Sales Executive',
      image: '/images/emp4.jpg',
      color: 'blue'
    },

    {
      id: 4,
      name: 'Deepanjali Pahanda',
      role: 'Sales Executive',
      image: '/images/emp3.jpg',
      color: 'purple'
    }
  ];

  return (
    <div className="min-h-screen bg-white overflow-hidden">

      {/* HERO SECTION */}
      <section className="relative bg-gradient-to-br from-black via-red-600 to-red-700 text-white py-32">

        <div className="absolute top-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>

        <div className="relative max-w-7xl mx-auto px-4 text-center z-10">

          <div className="inline-block px-5 py-2 rounded-full bg-white/10 border border-white/20 mb-6">
            <span className="text-sm uppercase tracking-widest font-semibold">
              About Dealinee
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
            India's Trusted
            <span className="block text-red-200">
              Real Estate Platform
            </span>
          </h1>

          <p className="text-lg md:text-2xl text-red-100 max-w-4xl mx-auto leading-relaxed">
            We help people discover their dream homes with trust,
            transparency, and modern technology.
          </p>

        </div>
      </section>

      {/* COMPANY STORY */}
      <section className="py-24 bg-white">

        <div className="max-w-7xl mx-auto px-4">

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            {/* IMAGE */}
            <div>
              <div className="rounded-3xl overflow-hidden shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800"
                  alt="Company"
                  loading="lazy"
                  className="w-full h-full object-cover hover:scale-105 transition duration-700"
                />
              </div>
            </div>

            {/* CONTENT */}
            <div>

              <div className="inline-block px-4 py-2 rounded-full bg-red-100 mb-5">
                <span className="text-red-600 font-semibold text-sm uppercase tracking-widest">
                  Our Story
                </span>
              </div>

              <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6">
                Discover Dealinee Estate
              </h2>

              <p className="text-gray-600 text-lg leading-relaxed mb-5">
                Dealinee Estate is a trusted real estate consultancy founded by
                <strong> Chandan Kumar Sahoo</strong>, with over <strong>6 years of experience</strong>
                in the property industry. We specialize in property buying, selling,
                renting, property management, and investment consulting.
              </p>

              <p className="text-gray-600 text-lg leading-relaxed mb-5">
                Our mission is to provide transparent, reliable, and customer-focused
                real estate solutions that help clients make confident property decisions.
                Whether you are searching for a home, selling a property, finding tenants,
                or investing in real estate, we offer professional guidance and personalized
                support at every step.
              </p>

              <p className="text-gray-600 text-lg leading-relaxed mb-8">
                At Dealinee Estate, we are committed to building trust and delivering value
                through exceptional service.
              </p>

              <Link
                to="/properties"
                className="inline-flex items-center gap-3 bg-red-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-red-700 transition"
              >
                Explore Properties
                <FaArrowRight />
              </Link>

            </div>

          </div>

        </div>
      </section>

      {/* FEATURES */}
      <section className="py-24 bg-gray-50">

        <div className="max-w-7xl mx-auto px-4">

          <div className="text-center mb-20">

            <h2 className="text-5xl font-black text-gray-900 mb-5">
              What Sets Us Apart
            </h2>

            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              We provide complete real estate solutions tailored for buyers,
              investors, and sellers.
            </p>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">

            {features.map((feature) => {

              const Icon = feature.icon;

              return (
                <div
                  key={feature.id}
                  className="bg-white rounded-3xl p-10 shadow-lg hover:shadow-2xl transition duration-500 hover:-translate-y-3"
                >

                  <div className="w-20 h-20 rounded-2xl bg-red-100 flex items-center justify-center mb-8">
                    <Icon className="text-4xl text-red-600" />
                  </div>

                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    {feature.title}
                  </h3>

                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>

                </div>
              );
            })}

          </div>

        </div>

      </section>

      {/* STATS */}
      <section className="py-24 bg-gradient-to-r from-black to-red-600 text-white">

        <div className="max-w-7xl mx-auto px-4">

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">

            {stats.map((stat) => (

              <div
                key={stat.id}
                className="text-center"
              >

                <h2 className="text-6xl font-black text-red-200 mb-4">
                  {stat.number}
                </h2>

                <h3 className="text-2xl font-bold mb-2">
                  {stat.title}
                </h3>

                <p className="text-red-100">
                  {stat.description}
                </p>

              </div>

            ))}

          </div>

        </div>

      </section>

      {/* FOUNDER */}
      <section className="py-24 bg-white">

        <div className="max-w-7xl mx-auto px-4">

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            {/* IMAGE */}
            <div>

              <div className="rounded-3xl overflow-hidden shadow-2xl">
                <img
                  src="/images/founder.jpg"
                  alt="Founder"
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              </div>

            </div>

            {/* CONTENT */}
            <div>

              <div className="inline-block px-4 py-2 rounded-full bg-red-100 mb-5">
                <span className="text-red-600 font-semibold text-sm uppercase tracking-widest">
                  Leadership
                </span>
              </div>

              <h2 className="text-5xl font-black text-gray-900 mb-3">
                Meet The Founder
              </h2>

              <p className="text-2xl font-bold text-red-600 mb-6">
                Mr. Chandan Kumar Sahoo
              </p>

              <p className="text-lg text-gray-600 leading-relaxed mb-6">
                With over 6 years of experience in the property industry, our founder
                Mr. Chandan Kumar Sahoo envisioned a consultancy built on trust,
                transparency, and customer-first service. His experience guides our
                approach to helping clients make informed property decisions.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                <div className="bg-red-50 rounded-2xl p-6 border border-red-100">

                  <div className="flex items-center gap-3 mb-4">
                    <FaBullseye className="text-3xl text-red-600" />
                    <h3 className="text-xl font-bold text-gray-900">
                      Vision
                    </h3>
                  </div>

                  <p className="text-gray-600">
                    To become India's most trusted property platform.
                  </p>

                </div>

                <div className="bg-red-50 rounded-2xl p-6 border border-red-100">

                  <div className="flex items-center gap-3 mb-4">
                    <FaLightbulb className="text-3xl text-red-600" />
                    <h3 className="text-xl font-bold text-gray-900">
                      Mission
                    </h3>
                  </div>

                  <p className="text-gray-600">
                    Deliver transparent and secure property solutions.
                  </p>

                </div>

              </div>

            </div>

          </div>

        </div>

      </section>

      {/* CO-FOUNDER */}
      <section className="py-24 bg-gray-50">

        <div className="max-w-7xl mx-auto px-4">

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            {/* CONTENT */}
            <div>

              <div className="inline-block px-4 py-2 rounded-full bg-red-100 mb-5">
                <span className="text-red-600 font-semibold text-sm uppercase tracking-widest">
                  Leadership
                </span>
              </div>

              <h2 className="text-5xl font-black text-gray-900 mb-3">
                Meet The Co-Founder
              </h2>

              <p className="text-2xl font-bold text-red-600 mb-6">
                Ms. Sandip Sahoo
              </p>

              <p className="text-lg text-gray-600 leading-relaxed mb-6">
                As co-founder, she brings strategic expertise and dedication to
                building a customer-centric real estate platform.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                <div className="bg-red-50 rounded-2xl p-6 border border-red-100">

                  <div className="flex items-center gap-3 mb-4">
                    <FaUsers className="text-3xl text-red-600" />
                    <h3 className="text-xl font-bold text-gray-900">
                      Customer Focus
                    </h3>
                  </div>

                  <p className="text-gray-600">
                    Ensuring every customer gets the best experience and support.
                  </p>

                </div>

                <div className="bg-red-50 rounded-2xl p-6 border border-red-100">

                  <div className="flex items-center gap-3 mb-4">
                    <FaAward className="text-3xl text-red-600" />
                    <h3 className="text-xl font-bold text-gray-900">
                      Excellence
                    </h3>
                  </div>

                  <p className="text-gray-600">
                    Committed to delivering excellence in every property listing.
                  </p>

                </div>

              </div>

            </div>

            {/* IMAGE */}
            <div>

              <div className="rounded-3xl overflow-hidden shadow-2xl">
                <img
                  src="/images/cofounder.jpg"
                  alt="Co-Founder"
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              </div>

            </div>

          </div>

        </div>

      </section>

      {/* TEAM */}
      <section className="py-24 bg-white">

        <div className="max-w-7xl mx-auto px-4">

          <div className="text-center mb-20">

            <h2 className="text-5xl font-black text-gray-900 mb-5">
              Our Expert Team
            </h2>

            <p className="text-lg text-gray-600">
              Meet our dedicated professionals
            </p>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">

            {teamMembers.map((member) => (

              <div
                key={member.id}
                className="bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition duration-500 hover:-translate-y-3"
              >

                <div className="h-80 overflow-hidden">
                  <img
                    src={member.image}
                    alt={member.name}
                    loading="lazy"
                    className="w-full h-full object-cover hover:scale-110 transition duration-700"
                  />
                </div>

                <div className="p-8">

                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {member.name}
                  </h3>

                  <p className="text-red-600 font-semibold mb-4">
                    {member.role}
                  </p>

                </div>

              </div>

            ))}

          </div>

        </div>

      </section>

      {/* CTA */}
      <section className="py-24 bg-gradient-to-r from-black to-red-600 text-white">

        <div className="max-w-7xl mx-auto px-4 text-center">

          <FaHome className="text-6xl mx-auto mb-8 text-red-200" />

          <h2 className="text-5xl md:text-6xl font-black mb-6">
            Ready To Find Your Dream Home?
          </h2>

          <p className="text-xl text-red-100 mb-10 max-w-3xl mx-auto">
            Explore premium properties and discover the perfect home for you.
          </p>

          <div className="flex flex-col md:flex-row gap-5 justify-center">

            <Link
              to="/properties"
              className="bg-white text-red-600 px-10 py-4 rounded-xl font-bold hover:bg-gray-100 transition"
            >
              Explore Properties
            </Link>

            <Link
              to="/contact"
              className="border-2 border-white px-10 py-4 rounded-xl font-bold hover:bg-white/10 transition"
            >
              Contact Us
            </Link>

          </div>

        </div>

      </section>

    </div>
  );
}

export default AboutPage;