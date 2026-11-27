import { type FormEvent, useEffect, useState } from 'react';
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Info,
  LayoutDashboard,
  LogIn,
  LogOut,
  Mail,
  Send,
} from 'lucide-react';
import { CrystalButton, CrystalCard3D } from './GlassPrimitives';
import { FloatingLogoTrigger, type LogoDestination } from './FloatingLogoTrigger';
import { SubtleBrainBackdrop } from './SubtleBrainBackdrop';
import { usePublicLanguage } from '../i18n';
import {
  STUDIO_OWNER_NAME,
  isOwnerEmail,
  saveStoredSession,
  useOwnerSession,
} from '../data/exhibitsStore';

interface LogoModalViewsProps {
  section: LogoDestination;
  onSwitchSection: (dest: LogoDestination) => void;
  onGoHome: () => void;
  onOpenBot: (prefillPrompt?: string) => void;
}

export function LogoModalViews({
  section,
  onSwitchSection,
  onGoHome,
  onOpenBot,
}: LogoModalViewsProps) {
  const language = usePublicLanguage();
  const en = language === 'en';
  // Contact form
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMsg, setContactMsg] = useState('');
  const [contactSent, setContactSent] = useState(false);

  const session = useOwnerSession();
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onGoHome();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onGoHome]);

  const handleContact = (e: FormEvent) => {
    e.preventDefault();
    if (!contactEmail.trim() || !contactMsg.trim()) return;
    setContactSent(true);
  };

  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    const em = loginEmail.trim().toLowerCase();
    const pass = loginPass.trim();
    if (!em || !pass) return;
    const owner = isOwnerEmail(em);
    const derivedName = owner ? STUDIO_OWNER_NAME : em.split('@')[0];
    saveStoredSession({
      email: em,
      name: derivedName,
      isOwner: owner,
      ...(owner ? { adminPin: pass } : {}),
    });
    setLoginPass('');
    if (owner) {
      onSwitchSection('admin');
    }
  };

  const handleLogout = () => {
    saveStoredSession(null);
  };

  const accent = section === 'contact' ? 'gold' : 'cyan';

  return (
    <div
      dir={en ? "ltr" : "rtl"}
      className="fixed inset-0 flex h-screen w-screen flex-col items-center justify-center overflow-hidden bg-[#020204] px-5 text-[#f3f5fa] select-none"
    >
      <SubtleBrainBackdrop accent={accent} />

      {/* Floating Top-Right Transparent DUPAMAN Logo */}
      <FloatingLogoTrigger
        mode="floating-corner"
        activeSection={section}
        onNavigate={onSwitchSection}
      />

      {/* Floating Top-Left Minimal Back Control */}
      <div className="fixed top-5 left-5 z-40">
        <CrystalButton hue="neutral" size="sm" onClick={onGoHome}>
          <ArrowRight className="h-3.5 w-3.5" />
          <span>{en ? "Back" : "חזרה"}</span>
        </CrystalButton>
      </div>

      {/* Centered Ultra-Clean Spatial Content */}
      <main className="relative z-20 flex w-full max-w-xl flex-col items-center gap-5">
        {/* Floating 3-Glass-Pill Switcher: About / Contact / Login */}
        <div className="flex items-center gap-2">
          <CrystalButton
            hue="cyan"
            size="sm"
            active={section === 'about'}
            onClick={() => onSwitchSection('about')}
          >
            <Info className="h-3.5 w-3.5" />
            <span>{en ? "About" : "אודות"}</span>
          </CrystalButton>
          <CrystalButton
            hue="gold"
            size="sm"
            active={section === 'contact'}
            onClick={() => onSwitchSection('contact')}
          >
            <Mail className="h-3.5 w-3.5" />
            <span>{en ? "Contact" : "יצירת קשר"}</span>
          </CrystalButton>
          <CrystalButton
            hue="cyan"
            size="sm"
            active={section === 'login'}
            onClick={() => onSwitchSection('login')}
          >
            <LogIn className="h-3.5 w-3.5" />
            <span>{en ? "Login" : "התחברות"}</span>
          </CrystalButton>
        </div>

        {/* Single Floating 3D Transparent Crystal-Glass Slab */}
        <CrystalCard3D hue={accent} interactive={false} className="w-full">
          <div className="p-6 sm:p-8">
            {section === 'about' && (
              <div className="flex flex-col gap-4">
                <div>
                  <div className="font-mono text-[11px] tracking-widest text-[#84e8ff]">
                    DUPAMAN · HERITAGE · EDUCATION · AI
                  </div>
                  <h1 className="mt-1.5 text-2xl font-bold text-white">אודות דופמין</h1>
                </div>

                <p className="text-sm leading-7 text-[#e6eaf3]">
                  <strong>דופמין (DUPAMAN)</strong> מאת <strong>רפאל ארגנטי</strong> הוא מרחב ידע
                  מרחבי ללא גלילה המחבר בין שישה עולמות תוכן מאומתים: מורשת ופילוסופיה יהודית,
                  חינוך ולמידה, פסיכולוגיה ובריאות, בינה מלאכותית, מדעי המוח, ומדע וחלל.
                </p>

                <p className="text-xs leading-6 text-[#cfd7e6] sm:text-sm">
                  במקום פיד רועש וגלילה אינסופית, האתר מציע חוויית זכוכית שקופה ורגועה: כל מוח
                  מוביל לאינדקס מקורות נקי, והמוח המרכזי מפעיל את הבוט החכם ומנהל המנויים.
                </p>

                <div className="mt-2 flex flex-wrap gap-2.5 pt-2">
                  <CrystalButton hue="gold" size="md" onClick={() => onOpenBot()}>
                    <Bot className="h-4 w-4 text-[#f8d478]" />
                    <span>כניסה לבוט ולמנויים</span>
                  </CrystalButton>
                  <CrystalButton
                    hue="cyan"
                    size="md"
                    onClick={() => onSwitchSection('contact')}
                  >
                    <Mail className="h-4 w-4 text-[#84e8ff]" />
                    <span>יצירת קשר</span>
                  </CrystalButton>
                </div>
              </div>
            )}

            {section === 'contact' && (
              <div className="flex flex-col gap-4">
                <div>
                  <div className="font-mono text-[11px] tracking-widest text-[#f8d478]">
                    DUPAMAN · DIRECT CONTACT
                  </div>
                  <h1 className="mt-1.5 text-2xl font-bold text-white">יצירת קשר</h1>
                  <p className="mt-1 text-xs text-[#cfd7e6]">
                    לשיתופי פעולה, סדנאות, רעיונות או שאלות לרפאל ארגנטי.
                  </p>
                </div>

                {contactSent ? (
                  <div className="flex flex-col items-center gap-3 py-6 text-center">
                    <CheckCircle2 className="h-9 w-9 text-emerald-300" />
                    <div className="text-base font-semibold text-white">ההודעה נשלחה בהצלחה</div>
                    <p className="text-xs text-[#d6dfee]">
                      תודה {contactName || ''}, נחזור אליך בקרוב לכתובת {contactEmail}.
                    </p>
                    <CrystalButton
                      hue="gold"
                      size="sm"
                      onClick={() => {
                        setContactSent(false);
                        setContactMsg('');
                      }}
                    >
                      שליחת הודעה נוספת
                    </CrystalButton>
                  </div>
                ) : (
                  <form onSubmit={handleContact} className="flex flex-col gap-3">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <input
                        type="text"
                        required
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder="שם"
                        className="rounded-xl border border-white/18 bg-white/[0.04] px-3.5 py-2.5 text-xs text-white placeholder-[#8e9bb2] outline-none focus:border-[#f8d478]/55"
                      />
                      <input
                        type="email"
                        required
                        dir="ltr"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder="name@email.com"
                        className="rounded-xl border border-white/18 bg-white/[0.04] px-3.5 py-2.5 text-left text-xs text-white placeholder-[#8e9bb2] outline-none focus:border-[#f8d478]/55"
                      />
                    </div>
                    <textarea
                      rows={3}
                      required
                      value={contactMsg}
                      onChange={(e) => setContactMsg(e.target.value)}
                      placeholder="הודעה..."
                      className="resize-none rounded-xl border border-white/18 bg-white/[0.04] px-3.5 py-2.5 text-xs text-white placeholder-[#8e9bb2] outline-none focus:border-[#f8d478]/55"
                    />
                    <CrystalButton hue="gold" size="md" type="submit" className="mt-1 w-full">
                      <Send className="h-3.5 w-3.5" />
                      <span>שלח פנייה</span>
                    </CrystalButton>
                  </form>
                )}
              </div>
            )}

            {section === 'login' && (
              <div className="flex flex-col gap-4">
                <div>
                  <div className="font-mono text-[11px] tracking-widest text-[#84e8ff]">
                    DUPAMAN · MEMBER ACCESS
                  </div>
                  <h1 className="mt-1.5 text-2xl font-bold text-white">התחברות לחשבון</h1>
                </div>

                {session ? (
                  <div className="flex flex-col items-center gap-3 py-4 text-center">
                    <CheckCircle2 className="h-9 w-9 text-[#84e8ff]" />
                    <div className="text-base font-semibold text-white">
                      מחובר כ-{session.name}
                    </div>
                    <div className="font-mono text-xs text-[#c7d3e6]">{session.email}</div>
                    <div className="mt-2 flex flex-wrap justify-center gap-2">
                      {session.isOwner && (
                        <CrystalButton
                          hue="gold"
                          size="sm"
                          onClick={() => onSwitchSection('admin')}
                        >
                          <LayoutDashboard className="h-3.5 w-3.5 text-[#f8d478]" />
                          <span>לוח בקרה · ניהול תכנים</span>
                        </CrystalButton>
                      )}
                      <CrystalButton hue="gold" size="sm" onClick={() => onOpenBot()}>
                        <Bot className="h-3.5 w-3.5 text-[#f8d478]" />
                        <span>למנהל המנויים והבוט</span>
                      </CrystalButton>
                      <CrystalButton hue="neutral" size="sm" onClick={handleLogout}>
                        <LogOut className="h-3.5 w-3.5" />
                        <span>התנתק</span>
                      </CrystalButton>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleLogin} className="flex flex-col gap-3">
                    <input
                      type="email"
                      required
                      dir="ltr"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="name@email.com"
                      className="rounded-xl border border-white/18 bg-white/[0.04] px-3.5 py-2.5 text-left text-xs text-white placeholder-[#8e9bb2] outline-none focus:border-[#84e8ff]/55"
                    />
                    <input
                      type="password"
                      required
                      dir="ltr"
                      value={loginPass}
                      onChange={(e) => setLoginPass(e.target.value)}
                      placeholder="••••••••"
                      className="rounded-xl border border-white/18 bg-white/[0.04] px-3.5 py-2.5 text-left text-xs text-white placeholder-[#8e9bb2] outline-none focus:border-[#84e8ff]/55"
                    />
                    <CrystalButton hue="cyan" size="md" type="submit" className="mt-1 w-full">
                      <LogIn className="h-3.5 w-3.5" />
                      <span>כניסה למערכת</span>
                    </CrystalButton>
                  </form>
                )}
              </div>
            )}
          </div>
        </CrystalCard3D>
      </main>
    </div>
  );
}
