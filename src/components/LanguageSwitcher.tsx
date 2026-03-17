import { useTranslation } from 'react-i18next';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  return (
    <div className="language-switcher" role="radiogroup" aria-label="Language">
      <button
        className={`language-switcher__btn ${i18n.language === 'fr' ? 'language-switcher__btn--active' : ''}`}
        onClick={() => i18n.changeLanguage('fr')}
        aria-pressed={i18n.language === 'fr'}
      >
        FR
      </button>
      <span className="language-switcher__sep">|</span>
      <button
        className={`language-switcher__btn ${i18n.language === 'en' ? 'language-switcher__btn--active' : ''}`}
        onClick={() => i18n.changeLanguage('en')}
        aria-pressed={i18n.language === 'en'}
      >
        EN
      </button>
    </div>
  );
}
