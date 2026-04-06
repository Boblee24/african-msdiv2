"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Nav() {
  const path = usePathname();

  const links = [
    { href: "/",             label: "Discovery Portal" },
    { href: "/submit",       label: "Data Ingestion" },
    { href: "/architecture", label: "Architecture" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center px-5 gap-0"
      style={{ background: "rgba(6,13,26,0.96)", borderBottom: "1px solid rgba(14,165,233,0.18)", backdropFilter: "blur(12px)" }}>

      {/* Logo */}
      <div className="flex items-center gap-2.5 mr-7 shrink-0">
        <div className="w-7 h-7 rounded-md flex items-center justify-center text-sm"
          style={{ background: "linear-gradient(135deg, #0ea5e9, #164e63)" }}>
          🌊
        </div>
        <span className="font-display text-[17px] font-semibold text-text-primary tracking-tight">
          African <span className="text-teal-bright">MSDI</span>
        </span>
      </div>

      {/* Links */}
      <div className="flex gap-1">
        {links.map((link) => {
          const active = path === link.href;
          return (
            <Link key={link.href} href={link.href}
              className={`px-3.5 py-1.5 rounded-md text-[13px] font-medium transition-all duration-150 no-underline ${
                active
                  ? "text-teal-bright bg-[rgba(14,165,233,0.12)] border border-[rgba(14,165,233,0.25)]"
                  : "text-text-secondary bg-transparent border border-transparent hover:text-text-primary"
              }`}>
              {link.label}
            </Link>
          );
        })}
      </div>

      {/* Right badges */}
      <div className="ml-auto flex items-center gap-2">
        <Badge color="rgba(34,197,94,0.12)" border="rgba(34,197,94,0.3)" text="#22c55e">
          PROTOTYPE · IHO S-100
        </Badge>
        <Badge color="rgba(167,139,250,0.1)" border="rgba(167,139,250,0.3)" text="#a78bfa">
          <span className="w-1.5 h-1.5 rounded-full inline-block mr-1.5"
            style={{ background: "#a78bfa", boxShadow: "0 0 5px #a78bfa" }} />
          SOVEREIGN AFRICAN CLOUD
        </Badge>
        <Badge color="rgba(14,165,233,0.08)" border="rgba(14,165,233,0.2)" text="#0891b2">
          3 NODES ACTIVE
        </Badge>
      </div>
    </nav>
  );
}

function Badge({ color, border, text, children }: {
  color: string; border: string; text: string; children: React.ReactNode;
}) {
  return (
    <div className="flex items-center px-2.5 py-0.5 rounded-full font-mono text-[11px] tracking-[0.05em]"
      style={{ background: color, border: `1px solid ${border}`, color: text }}>
      {children}
    </div>
  );
}
