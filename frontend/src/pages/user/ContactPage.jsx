import React from 'react';
import InquiryForm from '../../components/user/InquiryForm';
import { FaPhone, FaEnvelope, FaMapMarkerAlt } from 'react-icons/fa';

const ContactPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-red-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Contact Us</h1>
          <p className="text-xl text-red-100">We'd love to hear from you. Get in touch with us today.</p>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div>
              <h2 className="text-3xl font-bold text-gray-800 mb-8">Send us a Message</h2>

              <InquiryForm />
            </div>

            {/* Contact Info */}
            <div>
              <h2 className="text-3xl font-bold text-gray-800 mb-8">Contact Information</h2>

              <div className="space-y-8">
                <div className="flex space-x-4">
                  <FaPhone className="text-4xl text-red-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Phone</h3>
                    <p className="text-gray-600">+91 9776 621 999</p>
                    <p className="text-gray-600 text-sm mt-2">Contact us anytime</p>
                  </div>
                </div>

                <div className="flex space-x-4">
                  <FaEnvelope className="text-4xl text-red-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Email</h3>
                    <p className="text-gray-600">dealinee0@gmail.com</p>
                  </div>
                </div>

                <div className="flex space-x-4">
                  <FaMapMarkerAlt className="text-4xl text-red-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Address</h3>
                    <p className="text-gray-600">Flat GD, GROUND FLOOR</p>
                    <p className="text-gray-600">ISCON RESIDENCY, Patia</p>
                    <p className="text-gray-600">Bhubaneswar, 751024</p>
                  </div>
                </div>
              </div>

              {/* Map */}
              <div className="mt-12 rounded-lg overflow-hidden h-80 bg-gray-300">
                <iframe
                  title="location-map"
                  width="100%"
                  height="100%"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3740.8862649835346!2d85.83401!3d20.13256!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a1941feffffff%3A0x0!2sISCON%20RESIDENCY%2C%20Patia%2C%20Bhubaneswar!5e0!3m2!1sen!2sin!4v1234567890"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                ></iframe>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ContactPage;
