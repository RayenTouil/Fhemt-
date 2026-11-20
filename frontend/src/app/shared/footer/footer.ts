import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

// Pied de page, identique sur toutes les pages (il était écrit en dur dans app.ts).
@Component({
  selector: 'app-footer',
  imports: [RouterLink],
  template: `
    <footer class="footer">
      <nav aria-label="Liens du pied de page">
        <ul class="footer__links">
          <li><a routerLink="/about">À propos</a></li>
          <li><a routerLink="/contact">Contact</a></li>
          <li>
            <a href="https://github.com/RayenTouil/Fhemt-" target="_blank" rel="noopener">
              Code source sur GitHub<span class="visually-hidden"> (nouvel onglet)</span>
            </a>
          </li>
        </ul>
      </nav>
      <p>Fhemt ? · Projet web Sup'Com 2025/2026 · {{ stage }}</p>
    </footer>
  `,
})
export class Footer {
  readonly stage = 'Objectif 4';
}
