import React from 'react';
import InquiryForm from '../../components/user/InquiryForm';
import { LuPhone, LuMail, LuMapPin, LuArrowUpRight } from 'react-icons/lu';
import PublicPageLayout, { PageHero } from '../../components/user/PublicPageLayout';

const officeQuery = 'ISCON Residency, Patia, Bhubaneswar 751024';
const directions = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(officeQuery)}`;
export default function ContactPage() {
  return <PublicPageLayout className="site-contact">
    <PageHero page="Contact us" eyebrow="LET’S TALK PROPERTY" title={<>Your next move.<br /><em>Let’s talk.</em></>} description="Buying, selling, renting or simply exploring? Tell us what you have in mind, and our team will help you take the next step." media={<div className="site-contact-form"><p className="site-eyebrow">SEND AN ENQUIRY</p><h2>What can we help you with?</h2><p>Share a few details and leave us a message.</p><InquiryForm submitLabel="Send message" /></div>}>
      <div className="site-contact-information">
        <h2>Speak with our team.</h2>
        <div className="site-contact-methods">
          <div><span className="site-icon"><LuPhone aria-hidden="true" /></span><div><h3>Call us</h3><a href="tel:+919776621999">+91 9776 621 999 <small>Office</small></a><a href="tel:+919776631999">+91 9776 631 999 <small>Property enquiries</small></a></div></div>
          <div><span className="site-icon"><LuMail aria-hidden="true" /></span><div><h3>Write to us</h3><a href="mailto:dealinee0@gmail.com">dealinee0@gmail.com</a></div></div>
          <div><span className="site-icon"><LuMapPin aria-hidden="true" /></span><div><h3>Visit our office</h3><address>Flat GD, Ground Floor, ISCON Residency,<br />Patia, Bhubaneswar, Odisha 751024</address><a href={directions} target="_blank" rel="noopener noreferrer" className="site-text-link">Get directions<LuArrowUpRight aria-hidden="true" /></a></div></div>
        </div>
      </div>
    </PageHero>
    <section className="site-section site-office-section"><div className="site-shell"><div className="site-section-heading site-heading-with-link"><div><p className="site-eyebrow">FIND US IN BHUBANESWAR</p><h2>A local team. A real address.</h2></div><a href={directions} target="_blank" rel="noopener noreferrer" className="site-text-link">Open in Google Maps<LuArrowUpRight aria-hidden="true" /></a></div><div className="site-office-map"><iframe title="Dealinee Estate office location in Patia, Bhubaneswar" src={`https://maps.google.com/maps?q=${encodeURIComponent(officeQuery)}&output=embed`} loading="lazy" allowFullScreen referrerPolicy="no-referrer-when-downgrade" /></div></div></section>
  </PublicPageLayout>;
}
