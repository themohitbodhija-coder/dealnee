import React from 'react';
import { Link } from 'react-router-dom';
import { LuArrowRight, LuMail, LuPhone, LuMessagesSquare, LuLightbulb, LuShieldCheck, LuUsers, LuBadgeCheck, LuTrendingUp, LuMapPin } from 'react-icons/lu';
import PublicPageLayout, { PageHero, IconCard } from '../../components/user/PublicPageLayout';

const values = [
  [LuMessagesSquare, 'Transparency', 'We believe in open communication and honest practices in everything we do.'],
  [LuLightbulb, 'Innovation', 'We keep looking for better ways to solve problems and improve the client experience.'],
  [LuShieldCheck, 'Integrity', 'We take responsibility for our work and bring care to every decision.'],
  [LuUsers, 'Collaboration', 'We work together, listen to different perspectives and share what we know.'],
  [LuBadgeCheck, 'Excellence', 'We put quality and thoughtful service at the centre of our work.'],
  [LuTrendingUp, 'Growth', 'We believe in continuous learning and growing together as a team.'],
];
export default function CarrierPage() {
  return <PublicPageLayout className="site-careers">
    <PageHero page="Careers" eyebrow="BUILD YOUR NEXT CHAPTER WITH US" title={<>Good people.<br /><em>Meaningful work.</em></>} description="Help people find the spaces that shape their lives. Bring your ideas, curiosity and commitment to a team that values thoughtful work." media={<aside className="site-career-intro"><span className="site-icon"><LuUsers aria-hidden="true" /></span><h2>A team built on<br />shared purpose.</h2><p>Local knowledge. Open conversations. A commitment to doing things well.</p><div><LuMapPin aria-hidden="true" /><span>Bhubaneswar, Odisha</span></div><Link className="site-text-link" to="/about">Meet Dealinee<LuArrowRight aria-hidden="true" /></Link></aside>}>
      <a href="#career-contact" className="site-button site-button-primary">Introduce yourself<LuArrowRight aria-hidden="true" /></a><Link to="/about" className="site-text-link">Get to know us<LuArrowRight aria-hidden="true" /></Link>
    </PageHero>
    <section className="site-section site-story"><div className="site-shell site-story-grid"><div><p className="site-eyebrow">WORKING AT DEALINEE</p><h2>Your perspective<br />can make a difference.</h2></div><div className="site-prose"><p>We’re a collaborative team dedicated to making real estate simpler, more transparent and easier to navigate. Our work brings together people, property and practical problem-solving.</p><p>We value quality, integrity and a willingness to learn. If you care about the work you do and the people you do it for, we’d love to hear from you.</p></div></div></section>
    <section className="site-section site-muted"><div className="site-shell"><div className="site-section-heading"><p className="site-eyebrow">WHAT GUIDES OUR WORK</p><h2>Shared values. Everyday actions.</h2><p>These principles shape how we support our clients and each other.</p></div><div className="site-card-grid">{values.map(([Icon, title, description]) => <IconCard key={title} icon={Icon} title={title}>{description}</IconCard>)}</div></div></section>
    <section id="career-contact" className="site-section"><div className="site-shell site-career-contact-grid"><div><p className="site-eyebrow">LET’S START A CONVERSATION</p><h2>Tell us where<br />you’d like to grow.</h2><p className="site-body-copy">Have a role in mind or want to explore working with us? Email your CV and a short introduction, including the kind of work you’re interested in.</p><a className="site-button site-button-primary" href="mailto:careers@dealinee.com?subject=Career%20enquiry%20at%20Dealinee">Email your introduction<LuArrowRight aria-hidden="true" /></a></div><div className="site-career-contact-card"><h3>Connect with our team</h3><a href="mailto:careers@dealinee.com"><span className="site-icon"><LuMail aria-hidden="true" /></span><span><small>Careers email</small>careers@dealinee.com</span><LuArrowRight aria-hidden="true" /></a><a href="tel:+919776631999"><span className="site-icon"><LuPhone aria-hidden="true" /></span><span><small>Call us</small>+91 9776 631 999</span><LuArrowRight aria-hidden="true" /></a><p>Prefer to send a general enquiry?</p><Link to="/contact" className="site-text-link">Contact us<LuArrowRight aria-hidden="true" /></Link></div></div></section>
  </PublicPageLayout>;
}
