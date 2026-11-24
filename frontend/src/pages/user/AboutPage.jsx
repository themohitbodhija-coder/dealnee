import React from 'react';
import { Link } from 'react-router-dom';
import { LuArrowRight, LuHome, LuFileCheck2, LuClipboardCheck, LuTarget, LuLightbulb, LuChevronRight, LuCheck } from 'react-icons/lu';
import PublicPageLayout, { PageCTA, IconCard } from '../../components/user/PublicPageLayout';
import CountUpNumber from '../../components/user/CountUpNumber';

const team = [
  { name: 'Niharika Sahoo', role: 'Manager', image: '/images/emp2.jpg' },
  { name: 'Mousumi Praharaj', role: 'Sales Executive', image: '/images/emp4.jpg' },
  { name: 'Deepanjali Pahanda', role: 'Sales Executive', image: '/images/emp3.jpg' },
];
const leaders = [
  { name: 'Chandan Kumar Sahoo', role: 'Founder', image: '/images/founder.jpg', highlight: '6+ years in the property industry', focus: 'Experience that shapes every next step.', detail: 'His experience guides the consultancy’s work across property buying, selling, renting, management and investment consulting, with a focus on helping clients make informed decisions.', description: 'With over six years of experience in the property industry, Chandan founded Dealinee Estate with a clear purpose: to bring trust, transparency and customer-first service to every property decision.' },
  { name: 'Sandip Sahoo', role: 'Co-founder', image: '/images/cofounder.jpg', highlight: 'Customer-focused leadership', focus: 'Putting people at the heart of property.', detail: 'With a focus on customer experience and support, Sandip helps shape an approach that values clear communication, personal attention and service throughout the property journey.', description: 'Sandip brings strategic expertise and a commitment to building a customer-focused real estate consultancy, with personal service and care at the heart of the client experience.' },
];

export default function AboutPage() {
  return <PublicPageLayout className="site-about">
    <section className="site-about-intro">
      <div className="site-shell">
        <nav className="site-breadcrumb" aria-label="Breadcrumb"><Link to="/">Home</Link><LuChevronRight aria-hidden="true" /><span aria-current="page">About us</span></nav>
        <div className="site-about-intro-grid">
          <div><p className="site-eyebrow">ABOUT DEALINEE ESTATE</p><img className="site-about-brand-logo" src="/images/logo.png" alt="Dealinee Estate" width="653" height="575" /><h1>Property expertise.<br />Built on experience.</h1><p className="site-about-intro-note">Bhubaneswar-based real estate consultancy</p></div>
          <div className="site-prose"><p>Founded by Chandan Kumar Sahoo, Dealinee Estate brings together local market knowledge and over six years of property industry experience to help clients make confident real estate decisions.</p><p>Our expertise spans buying, selling, renting, property management and investment consulting. We support clients from understanding their requirements and exploring options to coordinating visits and navigating documentation.</p><p>Our approach is straightforward: transparent advice, personal attention and reliable support throughout your property journey.</p><Link to="/properties" className="site-text-link">Explore our properties<LuArrowRight aria-hidden="true" /></Link></div>
        </div>
      </div>
    </section>

    <section className="site-stats" aria-label="Dealinee at a glance"><div className="site-shell">{[[6, 'Years of experience', 'Hands-on knowledge of real estate'], [20, 'Team members', 'People dedicated to your next step'], [1000, 'Happy customers', 'Relationships built through service']].map(([number, title, text]) => <div key={title}><CountUpNumber value={number} /><h2>{title}</h2><p>{text}</p></div>)}</div></section>

    <section className="site-section site-muted"><div className="site-shell"><div className="site-section-heading"><p className="site-eyebrow">HOW WE HELP</p><h2>A simpler way to move forward.</h2><p>Practical support for buyers, sellers and investors.</p></div><div className="site-card-grid"><IconCard icon={LuHome} title="Easy home buying">A property search shaped around your requirements, with expert guidance along the way.</IconCard><IconCard icon={LuFileCheck2} title="Legal assistance">Support in understanding documentation and coordinating the details of your transaction.</IconCard><IconCard icon={LuClipboardCheck} title="Smooth documentation">Clear communication and paperwork support to help you stay informed throughout the process.</IconCard></div></div></section>

    <section className="site-section"><div className="site-shell"><div className="site-section-heading"><p className="site-eyebrow">THE PEOPLE BEHIND DEALINEE</p><h2>Leadership with a personal approach.</h2><p>A shared commitment to thoughtful advice and customer-first service.</p></div><div className="site-leadership-grid">
          {leaders.map(person => <article className="site-leader" key={person.name}>
            <div className="site-leader-image"><img src={person.image} alt={person.name} loading="lazy" width="600" height="700" /></div>
            <div className="site-person-copy">
              <p className="site-eyebrow">{person.role}</p>
              <h3>{person.name}</h3>
              <p className="site-leader-focus">{person.focus}</p>
              <p>{person.description}</p>
              <p>{person.detail}</p>
              <div className="site-leader-highlight"><LuCheck aria-hidden="true" /><span>{person.highlight}</span></div>
            </div>
          </article>)}
        </div><div className="site-purpose-grid"><div><span className="site-icon"><LuTarget aria-hidden="true" /></span><div><h3>Our vision</h3><p>To become India’s most trusted property platform.</p></div></div><div><span className="site-icon"><LuLightbulb aria-hidden="true" /></span><div><h3>Our mission</h3><p>To deliver transparent, reliable and customer-focused property solutions.</p></div></div></div></div></section>

    <section className="site-section site-team-section"><div className="site-shell"><div className="site-section-heading site-heading-with-link"><div><p className="site-eyebrow">YOUR PROPERTY TEAM</p><h2>People you can count on.</h2><p>Meet the professionals supporting your property journey.</p></div><Link to="/carrier" className="site-text-link">Join our team<LuArrowRight aria-hidden="true" /></Link></div><div className="site-team-grid">{team.map(person => <article className="site-team-card" key={person.name}><div><img src={person.image} alt={person.name} loading="lazy" width="600" height="700" /></div><h3>{person.name}</h3><p>{person.role}</p></article>)}</div></div></section>
    <PageCTA title="Let’s talk about your next move." description="Tell us what you’re looking for. We’ll help you explore the possibilities." />
  </PublicPageLayout>;
}
