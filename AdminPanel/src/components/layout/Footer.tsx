import Link from "next/link";

function SocialIcon({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex h-5 w-5 items-center justify-center" aria-hidden="true">
      {children}
    </span>
  );
}

const groups = [
  { title: "Quick Links", links: ["About Us", "Shipping", "Returns", "Track Order"] },
  { title: "Shop", links: ["Bedding", "Wall Decor", "Lighting", "Dining"] },
];

export function Footer() {
  return (
    <footer className="border-t border-brand-primary/30 bg-gradient-to-b from-[#1c1244] to-[#0e0828] text-slate-100">
      <div className="qh-container qh-footer-grid grid gap-8 py-12">
        <div>
          <Link href="/" className="qh-logo text-3xl font-bold hover:text-brand-accent transition-colors duration-200">QuirkyHome</Link>
          <p className="mt-4 text-base leading-relaxed text-slate-300 opacity-95">Warm, premium, playful decor for Indian homes that refuse to be boring.</p>
          <div className="mt-6 flex items-center gap-3">
            <Link href="#" aria-label="Instagram" className="qh-focus inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-700/60 text-slate-300 transition-colors duration-fast hover:border-brand-accent hover:text-brand-accent hover:scale-105">
              <SocialIcon>
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><path d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2Zm8.5 1.8h-8.5A3.95 3.95 0 0 0 3.8 7.75v8.5a3.95 3.95 0 0 0 3.95 3.95h8.5a3.95 3.95 0 0 0 3.95-3.95v-8.5a3.95 3.95 0 0 0-3.95-3.95ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 1.8A3.2 3.2 0 1 0 12 15.2a3.2 3.2 0 0 0 0-6.4Zm5.3-.95a1.15 1.15 0 1 1-2.3 0 1.15 1.15 0 0 1 2.3 0Z" /></svg>
              </SocialIcon>
            </Link>
            <Link href="#" aria-label="Pinterest" className="qh-focus inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-700/60 text-slate-300 transition-colors duration-fast hover:border-brand-accent hover:text-brand-accent hover:scale-105">
              <SocialIcon>
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><path d="M12 2a10 10 0 0 0-3.64 19.32c-.05-.82-.1-2.08.02-2.98l1.26-5.37s-.32-.64-.32-1.58c0-1.48.86-2.58 1.93-2.58.9 0 1.34.68 1.34 1.49 0 .9-.58 2.25-.88 3.5-.25 1.04.52 1.88 1.54 1.88 1.84 0 3.25-1.94 3.25-4.75 0-2.48-1.78-4.22-4.33-4.22-2.95 0-4.68 2.21-4.68 4.5 0 .9.35 1.86.78 2.38a.31.31 0 0 1 .07.3l-.3 1.22c-.05.2-.16.24-.36.15-1.35-.63-2.2-2.6-2.2-4.18 0-3.4 2.47-6.52 7.12-6.52 3.73 0 6.63 2.66 6.63 6.22 0 3.71-2.34 6.7-5.58 6.7-1.09 0-2.12-.57-2.47-1.24l-.67 2.56c-.24.93-.9 2.1-1.34 2.82A10 10 0 1 0 12 2Z" /></svg>
              </SocialIcon>
            </Link>
            <Link href="#" aria-label="YouTube" className="qh-focus inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-700/60 text-slate-300 transition-colors duration-fast hover:border-brand-accent hover:text-brand-accent hover:scale-105">
              <SocialIcon>
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><path d="M23 12s0-3.1-.4-4.6a3.2 3.2 0 0 0-2.2-2.2C18.9 4.8 12 4.8 12 4.8s-6.9 0-8.4.4a3.2 3.2 0 0 0-2.2 2.2C1 8.9 1 12 1 12s0 3.1.4 4.6a3.2 3.2 0 0 0 2.2 2.2c1.5.4 8.4.4 8.4.4s6.9 0 8.4-.4a3.2 3.2 0 0 0 2.2-2.2C23 15.1 23 12 23 12ZM10 15.5v-7l6 3.5-6 3.5Z" /></svg>
              </SocialIcon>
            </Link>
            <Link href="#" aria-label="Facebook" className="qh-focus inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-700/60 text-slate-300 transition-colors duration-fast hover:border-brand-accent hover:text-brand-accent hover:scale-105">
              <SocialIcon>
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><path d="M22 12a10 10 0 1 0-11.56 9.88V14.9H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.23.2 2.23.2v2.46H15.2c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.45 2.9h-2.33v6.98A10 10 0 0 0 22 12Z" /></svg>
              </SocialIcon>
            </Link>
            <Link href="#" aria-label="LinkedIn" className="qh-focus inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-700/60 text-slate-300 transition-colors duration-fast hover:border-brand-accent hover:text-brand-accent hover:scale-105">
              <SocialIcon>
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.03-1.84-3.03-1.85 0-2.14 1.45-2.14 2.95v5.65H9.35V9h3.42v1.56h.05c.48-.9 1.64-1.84 3.37-1.84 3.6 0 4.26 2.37 4.26 5.46v6.27ZM5.33 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14ZM7.11 20.45H3.55V9h3.56v11.45Z" /></svg>
              </SocialIcon>
            </Link>
          </div>
          <p className="mt-6 text-base leading-relaxed text-slate-300 opacity-90">
            Plot No. 263, Sector 25 Part 2, HUDA, Panipat, Haryana - 132103
          </p>
          <p className="mt-4 text-base font-semibold text-brand-accent">Talk to us</p>
          <p className="mt-2 text-base text-slate-300 opacity-95">+91 7678099909</p>
        </div>
        {groups.map((group) => (
          <div key={group.title}>
            <h3 className="text-lg font-semibold text-brand-accent border-b border-slate-800/60 pb-2 mb-4">{group.title}</h3>
            <div className="mt-4 grid gap-2 text-base text-slate-300">
              {group.links.map((link) => (
                <Link key={link} href="/search" className="transition-all duration-200 hover:text-brand-accent hover:translate-x-0.5">{link}</Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </footer>
  );
}

