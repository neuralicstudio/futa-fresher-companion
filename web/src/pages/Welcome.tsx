// The first screen on a new phone: the night gate, one handwritten line, one button.
//
// Exactly what the approved mockup has, and nothing more: no feature card, no tab bar, no
// profile icon (docs/design/SCREENS.md, 1). The button starts the first sync by opening Home,
// where App shows the sync screen while it runs.
import { Link, useNavigate } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import Footer from '../components/Footer';
import Hero from '../components/Hero';
import Icon from '../components/Icon';
import { COPY } from '../copy/pidgin';
import { markWelcomeSeen } from '../lib/firstRun';

export default function Welcome() {
  const navigate = useNavigate();

  function start() {
    markWelcomeSeen();
    navigate('/');
  }

  return (
    <>
      <Hero
        size="tall"
        className="hero--welcome"
        photo="/photos/gate-l.webp"
        kicker={COPY.welcome.kicker}
        title={COPY.welcome.title}
        gold={COPY.welcome.titleGold}
        lead={COPY.welcome.lead}
        header={<AppHeader variant="hero" showProfile={false} pill />}
      >
        <div className="cta">
          <button type="button" className="btn btn--maroon btn--block btn--lg" onClick={start}>
            <span>{COPY.welcome.start}</span>
            <Icon name="arrowRight" size={22} />
          </button>
        </div>
        <p className="login-line">
          {COPY.welcome.haveAccount} <Link to="/login">{COPY.welcome.login}</Link>
        </p>
      </Hero>

      <Footer photoCredit="Photo: Kaizenify, public domain (Wikimedia Commons)." />
    </>
  );
}
