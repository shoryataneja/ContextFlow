import { NavLink } from 'react-router-dom';

const links = [
  { to: '/', label: 'Dashboard' },
  { to: '/ask', label: '🤖 Ask AI' },
  { to: '/contexts', label: 'Contexts' },
  { to: '/retrieve', label: 'Retrieve' },
  { to: '/add', label: '+ Add' },
];

export default function Navbar() {
  return (
    <nav className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 flex items-center gap-6 h-14">
        <span className="font-bold text-brand-500 text-lg tracking-tight shrink-0">ContextFlow</span>
        <div className="flex gap-1 flex-wrap">
          {links.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  isActive ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}
