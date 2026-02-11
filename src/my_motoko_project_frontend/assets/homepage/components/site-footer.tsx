'use client';

export default function SiteFooter() {
  const SERVICES_LINKS = [
    { label: "Tuamess", href: "#services" },
    { label: "Tuamsdia", href: "#services" },
    { label: "Analytics", href: "#services" },
  ];

  const COMPANY_LINKS = [
    { label: "About Us", href: "#" },
    { label: "Careers", href: "#" },
    { label: "Blog", href: "#" },
    { label: "Contact", href: "#contact" },
  ];

  const SOCIAL_LINKS = [
    { label: "Instagram", href: "#" },
    { label: "Twitter", href: "#" },
    { label: "LinkedIn", href: "#" },
  ];

  return (
    <footer className="bg-foreground py-16">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 mb-12 pb-12"
          style={{ borderBottom: "1px solid hsl(var(--background) / 0.1)" }}
        >
          {/* Brand */}
          <div className="lg:col-span-2">
            <span
              className="font-serif text-3xl font-bold tracking-wide block mb-4"
              style={{ color: "hsl(var(--background))" }}
            >
              TUAMS
            </span>
            <p
              className="text-sm leading-relaxed max-w-xs"
              style={{ color: "hsl(var(--background) / 0.6)" }}
            >
              Bringing the new world of social media since 2025.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4
              className="text-sm font-medium uppercase tracking-widest mb-5"
              style={{ color: "hsl(var(--background))" }}
            >
              Services
            </h4>
            <ul className="flex flex-col gap-3">
              {SERVICES_LINKS.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm transition-all duration-300 hover:translate-x-1 inline-block"
                    style={{ color: "hsl(var(--background) / 0.6)" }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = "hsl(var(--accent))")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color =
                        "hsl(var(--background) / 0.6)")
                    }
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4
              className="text-sm font-medium uppercase tracking-widest mb-5"
              style={{ color: "hsl(var(--background))" }}
            >
              Company
            </h4>
            <ul className="flex flex-col gap-3">
              {COMPANY_LINKS.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm transition-all duration-300 hover:translate-x-1 inline-block"
                    style={{ color: "hsl(var(--background) / 0.6)" }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = "hsl(var(--accent))")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color =
                        "hsl(var(--background) / 0.6)")
                    }
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4
              className="text-sm font-medium uppercase tracking-widest mb-5"
              style={{ color: "hsl(var(--background))" }}
            >
              Follow Us
            </h4>
            <ul className="flex flex-col gap-3">
              {SOCIAL_LINKS.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm transition-all duration-300 hover:translate-x-1 inline-block"
                    style={{ color: "hsl(var(--background) / 0.6)" }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = "hsl(var(--accent))")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color =
                        "hsl(var(--background) / 0.6)")
                    }
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="text-center">
          <p
            className="text-xs"
            style={{ color: "hsl(var(--background) / 0.4)" }}
          >
            &copy; 2025 Tuams. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
