import { CalendarRange, Car, LayoutDashboard, Plus, ScrollText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { NavLink, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';

const LINKS = [
  { to: '/', label: 'nav.dashboard', icon: LayoutDashboard, end: true },
  { to: '/fleet', label: 'nav.fleet', icon: Car, end: false },
  { to: '/availability', label: 'nav.timeline', icon: CalendarRange, end: false },
  { to: '/bookings', label: 'nav.bookings', icon: ScrollText, end: true },
];

const mark = `${import.meta.env.BASE_URL}brand/mark.png`;

export function Layout({ children }: { children: ReactNode }) {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const takingBooking = location.pathname.startsWith('/bookings/new');

  return (
    <div className="min-h-screen bg-ink-950">
      <aside className="fixed inset-y-0 start-0 z-30 hidden w-64 flex-col border-e border-ink-700/50 bg-ink-900 lg:flex">
        <Brand />
        <nav className="flex-1 space-y-1 px-3 py-4">
          {LINKS.map((link) => (
            <SideLink key={link.to} {...link} />
          ))}
        </nav>
        <div className="p-3">
          <NavLink
            to="/bookings/new"
            className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition ${
              takingBooking
                ? 'bg-brass-400 text-white'
                : 'bg-brass-400/15 text-brass-300 ring-1 ring-brass-400/30 hover:bg-brass-400/25'
            }`}
          >
            <Plus size={16} />
            {t('nav.newBooking')}
          </NavLink>
        </div>
        <p className="px-5 pb-5 text-[11px] font-medium tracking-wide text-mist-500">{t('app.internal')}</p>
      </aside>

      <div className="lg:ps-64">
        <header className="sticky top-0 z-20 border-b border-ink-700/50 bg-ink-900/85 backdrop-blur">
          <div className="flex items-center justify-between gap-4 px-4 py-3 lg:px-8">
            <div className="lg:hidden">
              <Brand compact />
            </div>
            <div className="hidden lg:block" />
            <button
              type="button"
              onClick={() => void i18n.changeLanguage(i18n.language === 'ar' ? 'en' : 'ar')}
              className="rounded-lg border border-ink-600/60 px-3 py-1.5 text-sm font-medium text-mist-300 transition hover:border-brass-400/50 hover:text-brass-300"
            >
              {t('common.language')}
            </button>
          </div>

          <nav className="flex gap-1 overflow-x-auto px-3 pb-2 lg:hidden">
            {LINKS.map((link) => (
              <TopLink key={link.to} {...link} />
            ))}
            <TopLink to="/bookings/new" label="nav.newBooking" icon={Plus} end={false} />
          </nav>
        </header>

        <main className="mx-auto max-w-[1400px] px-4 py-6 lg:px-8 lg:py-10">{children}</main>
      </div>
    </div>
  );
}

function Brand({ compact = false }: { compact?: boolean }) {
  const wordmark = (
    <span className="min-w-0 text-[13px] font-bold leading-tight tracking-tight text-black">
      525 <span className="text-[#d1202d]">Rent a Car</span>
    </span>
  );

  if (compact) {
    return (
      <div className="flex items-center gap-2 rounded-md bg-white px-2 py-1">
        <img src={mark} alt="" className="h-9 w-auto" />
        {wordmark}
      </div>
    );
  }

  return (
    <div className="mx-3 mt-4 rounded-xl bg-white p-3">
      <div className="flex items-center gap-3">
        <img src={mark} alt="Five Two Five" className="h-14 w-auto shrink-0" />
        {wordmark}
      </div>
    </div>
  );
}

interface LinkProps {
  to: string;
  label: string;
  icon: typeof Car;
  end: boolean;
}

function SideLink({ to, label, icon: Icon, end }: LinkProps) {
  const { t } = useTranslation();
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
          isActive
            ? 'bg-ink-700/70 text-mist-100 ring-1 ring-ink-600/60'
            : 'text-mist-400 hover:bg-ink-800/60 hover:text-mist-200'
        }`
      }
    >
      <Icon size={17} />
      {t(label)}
    </NavLink>
  );
}

function TopLink({ to, label, icon: Icon, end }: LinkProps) {
  const { t } = useTranslation();
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition ${
          isActive ? 'bg-ink-700/70 text-mist-100' : 'text-mist-400'
        }`
      }
    >
      <Icon size={15} />
      {t(label)}
    </NavLink>
  );
}
