import { ApplicationRef, Injectable, computed, inject, signal } from '@angular/core';
import { UserPreferences } from './models';

// Les préférences d'affichage, valables pour toute l'application :
//
// 1. Deux habillages de la même application :
//    - « classique » : le design d'origine ;
//    - « fiche »     : une fiche de révision (papier Seyès, stylo bleu, surligneurs, stylo rouge du prof).
//    Appliqué avec l'attribut data-ui="fiche" sur <html>.
// 2. « Réduire les animations » : coupe les transitions et les effets (attribut data-motion="reduce"),
//    en plus du réglage « animations réduites » du système (prefers-reduced-motion, voir styles.css).
//
// Les deux choix sont mémorisés dans le localStorage ; index.html les applique avant même le
// démarrage d'Angular (pas de clignotement). Un utilisateur connecté peut aussi les enregistrer
// dans son profil : ils sont alors réappliqués à chaque connexion (applyPreferences).
export type UiMode = 'classique' | 'fiche';

const MODE_KEY = 'fhemt.ui';
const MOTION_KEY = 'fhemt.motion';
const FONTS_URL =
  'https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400&family=Kalam:wght@400;700&display=swap';

@Injectable({ providedIn: 'root' })
export class UiModeService {
  private readonly appRef = inject(ApplicationRef);

  readonly mode = signal<UiMode>(readStored(MODE_KEY) === 'fiche' ? 'fiche' : 'classique');
  readonly fiche = computed(() => this.mode() === 'fiche');
  readonly reduceMotion = signal(readStored(MOTION_KEY) === 'reduce');

  constructor() {
    applyMode(this.mode());
    applyMotion(this.reduceMotion());
  }

  // Le bouton « Mode fiche » de la barre de navigation.
  toggle() {
    this.setMode(this.fiche() ? 'classique' : 'fiche');
  }

  setMode(next: UiMode) {
    if (next === this.mode()) return;
    const apply = () => {
      this.mode.set(next);
      applyMode(next);
      this.appRef.tick(); // affiche tout de suite les éléments propres à chaque version
    };
    // Transition animée entre les deux versions, sauf si l'utilisateur limite les animations.
    // La classe « ui-switch » réserve l'effet « coup de surligneur » (ui-fiche.css) à ce
    // changement d'habillage : un simple changement de page garde son fondu discret.
    const doc = document as Document & {
      startViewTransition?: (cb: () => void) => { finished: Promise<void> };
    };
    if (doc.startViewTransition && !this.prefersLessMotion()) {
      const root = document.documentElement;
      root.classList.add('ui-switch');
      doc.startViewTransition(apply).finished.finally(() => root.classList.remove('ui-switch'));
    } else {
      apply();
    }
    store(MODE_KEY, next);
  }

  setReduceMotion(on: boolean) {
    this.reduceMotion.set(on);
    applyMotion(on);
    store(MOTION_KEY, on ? 'reduce' : 'auto');
  }

  // Les préférences enregistrées dans le profil (après la connexion ou un enregistrement).
  applyPreferences(preferences: UserPreferences | undefined) {
    if (!preferences) return;
    this.setReduceMotion(preferences.reduceMotion);
    this.setMode(preferences.uiMode);
  }

  // Vrai si l'utilisateur a demandé moins d'animations, dans Fhemt ? ou dans son système.
  prefersLessMotion(): boolean {
    return (
      this.reduceMotion() || !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    );
  }
}

function readStored(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function store(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* navigation privée : le choix ne sera pas mémorisé */
  }
}

function applyMode(mode: UiMode) {
  const root = document.documentElement;
  if (mode === 'fiche') {
    loadFonts(); // les polices ne sont chargées que si la version fiche est utilisée
    root.setAttribute('data-ui', 'fiche');
  } else {
    root.removeAttribute('data-ui');
  }
}

function applyMotion(reduce: boolean) {
  if (reduce) document.documentElement.setAttribute('data-motion', 'reduce');
  else document.documentElement.removeAttribute('data-motion');
}

function loadFonts() {
  if (document.getElementById('fhemt-fiche-fonts')) return;
  const link = document.createElement('link');
  link.id = 'fhemt-fiche-fonts';
  link.rel = 'stylesheet';
  link.href = FONTS_URL;
  document.head.appendChild(link);
}
