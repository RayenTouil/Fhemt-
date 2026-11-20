// Tests de la barre de navigation : liens selon le rôle et menu burger accessible.
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '../../core/auth';
import { Navbar } from './navbar';

describe('Navbar', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
  });

  const links = (el: HTMLElement) =>
    [...el.querySelectorAll('.nav__links a')].map((a) => a.textContent?.trim());

  it('montre les liens publics à un visiteur, les liens enseignant à un enseignant', () => {
    const fixture = TestBed.createComponent(Navbar);
    fixture.detectChanges();
    expect(links(fixture.nativeElement)).toEqual(['À propos', 'Contact']);

    TestBed.inject(AuthService).setUser({
      id: 't',
      email: 't@t.tn',
      name: 'Prof',
      role: 'teacher',
    });
    fixture.detectChanges();
    expect(links(fixture.nativeElement)).toEqual(['Ma classe', 'Questions']);
  });

  it('le bouton Menu ouvre et ferme le menu (aria-expanded), Échap le referme', () => {
    const fixture = TestBed.createComponent(Navbar);
    fixture.detectChanges();
    const burger: HTMLButtonElement = fixture.nativeElement.querySelector('.nav__burger');
    expect(burger.getAttribute('aria-expanded')).toBe('false');
    expect(burger.getAttribute('aria-controls')).toBe('nav-menu');

    burger.click();
    fixture.detectChanges();
    expect(burger.getAttribute('aria-expanded')).toBe('true');

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    expect(burger.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(burger); // le focus revient au bouton
  });
});
