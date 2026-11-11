import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function PolicyLayout({ title, description, sections, children }) {
  const { hash } = useLocation();

  useEffect(() => {
    const previousTitle = document.title;
    document.title = `${title} | Dealinee Estate`;
    return () => { document.title = previousTitle; };
  }, [title]);

  useEffect(() => {
    const section = document.getElementById(hash.slice(1));
    if (section) section.scrollIntoView();
    else if (!hash) window.scrollTo(0, 0);
  }, [hash]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <header className="relative overflow-hidden bg-gradient-to-br from-gray-950 via-red-700 to-red-600 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.18),_transparent_40%)]" />
        <div className="absolute -left-12 top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-red-300/20 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 md:py-28">
          <div className="mb-6 inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-red-50">
            Dealinee Estate
          </div>
          <h1 className="max-w-4xl text-4xl font-black leading-tight md:text-6xl">{title}</h1>
          <p className="mt-5 max-w-3xl text-base text-red-100 md:text-xl">{description}</p>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-4 py-12 md:py-16">
        <div className="grid gap-10 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-3xl border border-red-100 bg-white p-6 shadow-sm shadow-red-100/50">
              <p className="mb-4 text-sm font-bold uppercase tracking-[0.16em] text-red-600">Contents</p>
              <nav aria-label={`${title} contents`} className="space-y-2 lg:max-h-[calc(100vh-12rem)] lg:overflow-y-auto">
                {sections.map(section => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="block rounded-xl px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-red-50 hover:text-red-700"
                  >
                    {section.title}
                  </a>
                ))}
              </nav>
            </div>
          </aside>
          <article className="space-y-8">{children}</article>
        </div>
      </div>
    </div>
  );
}
