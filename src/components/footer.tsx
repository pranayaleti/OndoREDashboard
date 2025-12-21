import { Link } from "react-router-dom"
import { companyInfo } from "@/constants/companyInfo"

const footerLinks = {
  Product: [
    { label: "Overview", href: "/#product" },
    { label: "Features", href: "/#features" },
    { label: "Pricing", href: "/pricing" },
    { label: "Free trial", href: "/free-trial" },
  ],
  Company: [
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
    { label: "FAQ", href: "/faq" },
    { label: "Careers", href: "/contact" },
  ],
  Support: [
    { label: "Owner sign up", href: "/register" },
    { label: "Tenant login", href: "/login" },
    { label: "Docs", href: "/faq" },
    { label: "Status", href: "/contact" },
  ],
  Legal: [
    { label: "Privacy", href: "/privacy" },
    { label: "Terms", href: "/terms" },
  ],
}

export function Footer() {
  return (
    <footer className="bg-slate-950 text-white">
      <div className="container mx-auto grid gap-10 px-4 py-12 md:grid-cols-2 lg:grid-cols-4">
        {Object.entries(footerLinks).map(([section, links]) => (
          <div key={section}>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">{section}</p>
            <ul className="mt-4 space-y-2 text-sm text-white/70">
              {links.map((link) => (
                <li key={link.label}>
                  <Link to={link.href} className="transition hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10">
        <div className="container mx-auto flex flex-col gap-2 px-4 py-6 text-center text-xs text-white/60 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} {companyInfo.name}. All rights reserved.</p>
          <p>Crafted for independent landlords & tenants.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
