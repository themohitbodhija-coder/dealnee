import React from 'react';
import { Link } from 'react-router-dom';
import { FaArrowRight, FaEnvelope, FaPhone } from 'react-icons/fa';
import Container from '../../components/common/Container';

const CarrierPage = () => {
  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-red-700 to-red-600 text-white">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/5 rounded-full blur-3xl" />

        <Container className="relative py-24 md:py-32">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
              Join Our Team
            </h1>
            <p className="text-lg md:text-xl text-red-100 mb-8 leading-relaxed">
              We're building the future of real estate with innovation, transparency, and integrity. 
              Help us transform how people buy, sell, and invest in properties.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="#contact"
                className="inline-flex items-center justify-center gap-2 bg-white text-red-700 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
              >
                Get In Touch
                <FaArrowRight />
              </a>
              <Link
                to="/properties"
                className="inline-flex items-center justify-center gap-2 border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition"
              >
                Explore Our Platform
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* ABOUT US SECTION */}
      <section className="py-20 bg-white">
        <Container>
          <div className="max-w-3xl mx-auto text-center md:text-left">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">About Working at Dealinee</h2>
            <p className="text-lg text-gray-700 mb-6 leading-relaxed">
              At Dealinee, we believe in building a product that our team genuinely believes in. We're a collaborative, 
              innovative team dedicated to creating transparent and user-friendly real estate solutions.
            </p>
            <p className="text-lg text-gray-700 leading-relaxed">
              We value quality over speed, integrity over shortcuts, and growth over comfort. 
              If you're passionate about technology and want to make a real impact, we'd love to hear from you.
            </p>
          </div>
        </Container>
      </section>

      {/* VALUES SECTION */}
      <section className="py-20 bg-gray-50">
        <Container>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-12 text-center">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: 'Transparency',
                desc: 'We believe in open communication and honest practices in everything we do.'
              },
              {
                title: 'Innovation',
                desc: 'We continuously seek better ways to solve problems and improve user experiences.'
              },
              {
                title: 'Integrity',
                desc: 'We take responsibility and maintain high ethical standards in all our decisions.'
              },
              {
                title: 'Collaboration',
                desc: 'We work together as a team, valuing diverse perspectives and ideas.'
              },
              {
                title: 'Excellence',
                desc: 'We strive for quality in every aspect of our work and products.'
              },
              {
                title: 'Growth',
                desc: 'We invest in our people and believe in continuous learning and development.'
              }
            ].map((value, idx) => (
              <div key={idx} className="bg-white rounded-lg p-8 border border-gray-200 hover:shadow-md transition">
                <h3 className="text-xl font-bold text-gray-900 mb-3">{value.title}</h3>
                <p className="text-gray-600 leading-relaxed">{value.desc}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      
    

      {/* CTA SECTION */}
      <section id="contact" className="py-20 bg-white">
        <Container>
          <div className="bg-gradient-to-r from-slate-900 to-red-600 rounded-2xl p-12 md:p-16 text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Make an Impact?</h2>
            <p className="text-lg text-red-100 mb-10 leading-relaxed">
              We're always looking for talented individuals to join our growing team. 
              Whether you have a specific role in mind or just want to explore opportunities, 
              we'd love to connect with you.
            </p>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <FaEnvelope className="text-xl" />
                <span className="text-lg">careers@dealinee.com</span>
              </div>
              <div className="flex items-center gap-3">
                <FaPhone className="text-xl" />
                <span className="text-lg">+91 9776631999</span>
              </div>
            </div>
            <div className="mt-10">
              <Link
                to="/contact"
                className="inline-flex items-center justify-center gap-2 bg-white text-red-700 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
              >
                Send us a Message
                <FaArrowRight />
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* SIMPLE FOOTER TEXT */}
      <section className="py-12 bg-gray-50 border-t border-gray-200">
        <Container className="text-center">
          <p className="text-gray-600">
            Thank you for your interest in Dealinee. We review every application carefully 
            and will get back to you soon.
          </p>
        </Container>
      </section>
    </div>
  );
};

export default CarrierPage;
