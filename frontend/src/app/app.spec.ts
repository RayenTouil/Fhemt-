// Test de la coquille de l'application : lien d'évitement, navigation, contenu, pied de page.
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([]), provideHttpClient()],
    }).compileComponents();
  });

  it('affiche le lien « Aller au contenu », la navigation, le contenu et le pied de page', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const skip = el.querySelector('.skip-link') as HTMLAnchorElement;
    expect(skip.textContent).toBe('Aller au contenu');
    expect(el.querySelector('app-navbar')).toBeTruthy();
    expect(el.querySelector('main#contenu')).toBeTruthy();
    expect(el.querySelector('app-footer')).toBeTruthy();
  });

  it('le lien d’évitement place le focus sur le contenu', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    (el.querySelector('.skip-link') as HTMLAnchorElement).click();
    expect(document.activeElement?.id).toBe('contenu');
  });
});
