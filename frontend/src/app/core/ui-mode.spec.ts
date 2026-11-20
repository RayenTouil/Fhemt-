// Tests des préférences d'affichage : habillage fiche et animations réduites.
import { TestBed } from '@angular/core/testing';
import { UiModeService } from './ui-mode';

describe('UiModeService', () => {
  const root = document.documentElement;

  beforeEach(() => {
    localStorage.clear();
    root.removeAttribute('data-ui');
    root.removeAttribute('data-motion');
  });

  it('bascule entre classique et fiche, et s’en souvient', () => {
    const ui = TestBed.inject(UiModeService);
    expect(ui.fiche()).toBe(false);
    ui.toggle();
    expect(ui.fiche()).toBe(true);
    expect(root.getAttribute('data-ui')).toBe('fiche');
    expect(localStorage.getItem('fhemt.ui')).toBe('fiche');
  });

  it('applique les préférences enregistrées dans le profil', () => {
    const ui = TestBed.inject(UiModeService);
    ui.applyPreferences({ uiMode: 'fiche', reduceMotion: true });
    expect(ui.mode()).toBe('fiche');
    expect(root.getAttribute('data-motion')).toBe('reduce');
    expect(ui.prefersLessMotion()).toBe(true);
    ui.setReduceMotion(false);
    expect(root.hasAttribute('data-motion')).toBe(false);
  });
});
