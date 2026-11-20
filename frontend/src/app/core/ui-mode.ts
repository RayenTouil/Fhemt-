import { ApplicationRef, Injectable, computed, inject, signal } from '@angular/core';

// Deux habillages de la même application :
//  - « classique » : le design d'origine ;
//  - « fiche »     : une fiche de révision (papier Seyès, stylo bleu, surligneurs, stylo rouge du prof).
// Le choix est mémorisé dans le localStorage et appliqué avec l'attribut data-ui sur <html>.
export type UiMode = 'classique' | 'fiche';

const STORAGE_KEY = 'fhemt.ui';
const FONTS_URL =
  'https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400&family=Kalam:wght@400;700&display=swap';

@Injectable({ providedIn: 'root' })
export class UiModeService {
  private readonly appRef = inject(ApplicationRef);

  readonly mode = signal<UiMode>(readStored());
  readonly fiche = computed(() => this.mode() === 'fiche');

  constructor() {
    applyToDocument(this.mode());
  }

  toggle() {
    const next: UiMode = this.fiche() ? 'classique' : 'fiche';
    const apply = () => {
      this.mode.set(next);
      applyToDocument(next);
      this.appRef.tick(); // affiche tout de suite les éléments propres à chaque version
    };
    // Transition animée entre les deux versions, sauf si l'utilisateur limite les animations.
    // La classe « ui-switch » réserve l'effet « coup de surligneur » (ui-fiche.css) à ce
    // changement d'habillage : un simple changement de page garde son fondu discret.
    const doc = document as Document & {
      startViewTransition?: (cb: () => void) => { finished: Promise<void> };
    };
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (doc.startViewTransition && !reduceMotion) {
      const root = document.documentElement;
      root.classList.add('ui-switch');
      doc
        .startViewTransition(apply)
        .finished.finally(() => root.classList.remove('ui-switch'));
    } else {
      apply();
    }
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* navigation privée : le choix ne sera pas mémorisé */
    }
  }
}

function readStored(): UiMode {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'fiche' ? 'fiche' : 'classique';
  } catch {
    return 'classique';
  }
}

function applyToDocument(mode: UiMode) {
  const root = document.documentElement;
  if (mode === 'fiche') {
    loadFonts(); // les polices ne sont chargées que si la version fiche est utilisée
    root.setAttribute('data-ui', 'fiche');
  } else {
    root.removeAttribute('data-ui');
  }
}

function loadFonts() {
  if (document.getElementById('fhemt-fiche-fonts')) return;
  const link = document.createElement('link');
  link.id = 'fhemt-fiche-fonts';
  link.rel = 'stylesheet';
  link.href = FONTS_URL;
  document.head.appendChild(link);
}
