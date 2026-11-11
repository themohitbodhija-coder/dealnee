import React from 'react';
import { Link } from 'react-router-dom';
import PolicyLayout from './PolicyLayout';
import sections from './termsContent.json';

const linkClass = 'break-words font-medium text-red-700 underline underline-offset-2 hover:text-red-900';
const contactLinks = {
  'Phone: +91 97766 21999': ['Phone: ', '+91 97766 21999', 'tel:+919776621999'],
  'Email: dealinee0@gmail.com': ['Email: ', 'dealinee0@gmail.com', 'mailto:dealinee0@gmail.com'],
  'Website: https://www.dealinee.com/': ['Website: ', 'https://www.dealinee.com/', 'https://www.dealinee.com/'],
};

function TermsBlock({ block, sectionId }) {
  if (block.type === 'heading') {
    return <h3 className="pt-2 text-lg font-bold text-gray-900">{block.text}</h3>;
  }
  if (block.type === 'list') {
    return (
      <ul className="list-disc space-y-2 pl-6">
        {block.items.map(item => <li key={item}>{item}</li>)}
      </ul>
    );
  }
  const contact = contactLinks[block.text];
  if (contact) {
    const [label, value, href] = contact;
    return <p>{label}<a href={href} className={linkClass}>{value}</a></p>;
  }
  if (sectionId === 'privacy-and-personal-information' && block.text.includes('Privacy Policy')) {
    const [before, after] = block.text.split('Privacy Policy');
    return <p>{before}<Link to="/privacy-policy" className={linkClass}>Privacy Policy</Link>{after}</p>;
  }
  return <p>{block.text}</p>;
}

export default function TermsAndConditionsPage() {
  return (
    <PolicyLayout
      title="Terms & Conditions"
      description={<>Last Updated: <time dateTime="2026-11-06">6 November 2026</time></>}
      sections={sections}
    >
      {sections.map(section => (
        <section key={section.id} id={section.id} className="scroll-mt-24 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
          <h2 className="mb-4 text-2xl font-black text-red-600 md:text-3xl">{section.title}</h2>
          <div className="space-y-4 text-base leading-8 text-gray-700">
            {section.blocks.map(block => (
              <TermsBlock key={block.text || block.items[0]} block={block} sectionId={section.id} />
            ))}
          </div>
        </section>
      ))}
    </PolicyLayout>
  );
}
