// Tests des composants partagés (dossier shared/) : ce qu'ils affichent et ce qu'ils annoncent
// aux lecteurs d'écran.
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { EmptyState } from './empty-state/empty-state';
import { ErrorState } from './error-state/error-state';
import { FieldControl, FormField } from './form-field/form-field';
import { Footer } from './footer/footer';
import { MasteryBar } from './mastery-bar/mastery-bar';
import { MasteryLegend } from './mastery-legend/mastery-legend';
import { PageHeader } from './page-header/page-header';
import { Skeleton } from './skeleton/skeleton';
import { StatusBadge } from './status-badge/status-badge';

describe('composants partagés', () => {
  it('PageHeader affiche l’étiquette, le titre h1 et le sous-titre', () => {
    const fixture = TestBed.createComponent(PageHeader);
    fixture.componentRef.setInput('eyebrow', 'Parcours');
    fixture.componentRef.setInput('heading', 'Quoi faire ensuite');
    fixture.componentRef.setInput('subtitle', 'Trois étapes.');
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.eyebrow')?.textContent).toBe('Parcours');
    expect(el.querySelector('h1')?.textContent).toBe('Quoi faire ensuite');
    expect(el.querySelector('.muted')?.textContent).toBe('Trois étapes.');
  });

  it('MasteryBar est une jauge accessible, colorée selon le statut', () => {
    const fixture = TestBed.createComponent(MasteryBar);
    fixture.componentRef.setInput('level', 80);
    fixture.componentRef.setInput('name', 'Nyquist');
    fixture.detectChanges();
    const meter: HTMLElement = fixture.nativeElement.querySelector('[role="meter"]');
    expect(meter.getAttribute('aria-valuenow')).toBe('80');
    expect(meter.getAttribute('aria-valuetext')).toBe('80 %, maîtrisé');
    expect(meter.getAttribute('aria-label')).toBe('Maîtrise : Nyquist');
    expect(fixture.nativeElement.querySelector('.bar__fill').classList).toContain('is-mastered');
  });

  it('StatusBadge affiche un statut de maîtrise ou un type d’étape', () => {
    const fixture = TestBed.createComponent(StatusBadge);
    fixture.componentRef.setInput('status', 'weak');
    fixture.detectChanges();
    const badge: HTMLElement = fixture.nativeElement.querySelector('.badge');
    expect(badge.textContent).toBe('Faible');
    expect(badge.classList).toContain('is-weak');
    fixture.componentRef.setInput('kind', 'diagnostic');
    fixture.detectChanges();
    expect(badge.textContent).toBe('Diagnostic');
  });

  it('ErrorState annonce l’erreur (role="alert") et prévient la page au clic sur Réessayer', () => {
    const fixture = TestBed.createComponent(ErrorState);
    fixture.componentRef.setInput('message', 'Serveur injoignable.');
    let retried = 0;
    fixture.componentInstance.retry.subscribe(() => retried++);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('[role="alert"]')?.textContent).toContain('Serveur injoignable.');
    (el.querySelector('button') as HTMLButtonElement).click();
    expect(retried).toBe(1);
  });

  it('Skeleton est annoncé « Chargement… » et ses blocs sont cachés aux lecteurs d’écran', () => {
    const fixture = TestBed.createComponent(Skeleton);
    fixture.componentRef.setInput('variant', 'path');
    fixture.componentRef.setInput('count', 3);
    fixture.componentRef.setInput('label', 'Construction du parcours…');
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('[role="status"]')?.textContent).toContain('Construction du parcours…');
    expect(el.querySelectorAll('.sk-step').length).toBe(3);
    expect(el.querySelector('[aria-hidden="true"]')).toBeTruthy();
  });

  it('EmptyState et MasteryLegend affichent leur texte', () => {
    const empty = TestBed.createComponent(EmptyState);
    empty.componentRef.setInput('heading', 'Aucun concept évalué');
    empty.detectChanges();
    expect(empty.nativeElement.querySelector('h2').textContent).toBe('Aucun concept évalué');

    const legend = TestBed.createComponent(MasteryLegend);
    legend.componentRef.setInput('notAssessedNote', 'pas compté dans la moyenne');
    legend.detectChanges();
    expect(legend.nativeElement.querySelectorAll('li').length).toBe(4);
    expect(legend.nativeElement.textContent).toContain('pas compté dans la moyenne');
  });

  it('Footer contient les liens À propos et Contact', async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(Footer);
    fixture.detectChanges();
    const links = [...fixture.nativeElement.querySelectorAll('a')].map((a: HTMLAnchorElement) =>
      a.getAttribute('href'),
    );
    expect(links).toContain('/about');
    expect(links).toContain('/contact');
  });
});

// Un petit composant de test qui utilise <app-form-field> comme le ferait une page.
@Component({
  imports: [FormField, FieldControl],
  template: `
    <app-form-field label="E-mail" hint="Ton adresse Sup'Com" [error]="error()">
      <input appFieldControl type="email" />
    </app-form-field>
  `,
})
class FormHost {
  readonly error = signal('');
}

describe('FormField + appFieldControl', () => {
  it('relie le libellé, l’aide et l’erreur au champ', () => {
    const fixture = TestBed.createComponent(FormHost);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const input = el.querySelector('input') as HTMLInputElement;
    const label = el.querySelector('label') as HTMLLabelElement;
    expect(label.getAttribute('for')).toBe(input.id); // cliquer sur le libellé = aller au champ
    expect(input.getAttribute('aria-invalid')).toBeNull();
    expect(input.getAttribute('aria-describedby')).toContain('-aide');

    fixture.componentInstance.error.set('Ce champ est obligatoire.');
    fixture.detectChanges();
    expect(input.getAttribute('aria-invalid')).toBe('true');
    const errorId = input.getAttribute('aria-describedby')?.split(' ')[1] ?? '';
    expect(el.querySelector(`#${errorId}`)?.textContent).toBe('Ce champ est obligatoire.');
  });
});
