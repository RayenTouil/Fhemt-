import { Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../core/auth';
import { roleLabel } from '../../core/levels';
import { UiModeService } from '../../core/ui-mode';

// Barre de navigation, différente selon le rôle (visiteur, étudiant, enseignant).
//
// Sur téléphone et tablette (moins de 900 px de large), les liens sont rangés derrière un
// bouton « Menu » (le menu burger). Pour l'accessibilité :
//  - aria-expanded dit au lecteur d'écran si le menu est ouvert ;
//  - aria-controls relie le bouton au menu qu'il ouvre ;
//  - Échap ferme le menu et remet le focus sur le bouton ;
//  - le menu se referme tout seul quand on change de page.
@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  host: { '(document:keydown.escape)': 'closeOnEscape()' },
})
export class Navbar {
  readonly auth = inject(AuthService);
  readonly ui = inject(UiModeService);
  private readonly router = inject(Router);
  private readonly burger = viewChild<ElementRef<HTMLButtonElement>>('burger');

  readonly roleLabel = roleLabel;
  readonly menuOpen = signal(false);

  constructor() {
    // Fermer le menu à chaque changement de page.
    this.router.events
      .pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.menuOpen.set(false));
  }

  toggleMenu() {
    this.menuOpen.update((open) => !open);
  }

  closeOnEscape() {
    if (!this.menuOpen()) return;
    this.menuOpen.set(false);
    this.burger()?.nativeElement.focus();
  }

  logout() {
    this.menuOpen.set(false);
    this.auth.logout();
    this.router.navigateByUrl('/');
  }
}
