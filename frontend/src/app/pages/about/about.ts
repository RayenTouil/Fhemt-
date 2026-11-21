import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageHeader } from '../../shared/page-header/page-header';

// Page « À propos » (publique) : le projet, l'équipe, les étapes du projet et les technologies.
// Le contenu est rangé dans des tableaux ci-dessous ; le template les affiche avec @for.
@Component({
  selector: 'app-about',
  imports: [RouterLink, PageHeader],
  templateUrl: './about.html',
})
export class About {
  // L'équipe. `role` : ce que chacun a pris en charge (affiché seulement s'il est rempli).
  readonly team = [
    {
      name: 'Rayen Touil',
      initials: 'RT',
      role: 'Frontend et mise en ligne : pages Angular, design, accessibilité, fhemt.me.',
    },
    {
      name: 'Wajdi Zentani',
      initials: 'WZ',
      role: 'Backend et qualité : API Express, règles, mode démo, tests et CI.',
    },
  ];

  // Les quatre objectifs du projet web, du cadrage au site finalisé.
  readonly milestones = [
    {
      title: 'Objectif 1 · Définir le projet',
      text: 'Le problème, le public (étudiants et enseignants), les fonctionnalités et l’architecture cible.',
    },
    {
      title: 'Objectif 2 · Découverte produit',
      text: 'Personas, matrice MVP, SWOT et concurrents, avec l’aide de l’IA et un regard critique sur ses réponses.',
    },
    {
      title: 'Objectif 3 · MVP',
      text: 'Les sept pages du cœur de Fhemt ? : quiz, maîtrise, parcours, carte des concepts, carte de chaleur.',
    },
    {
      title: 'Objectif 4 · Site finalisé',
      text: 'Toutes les pages, des composants réutilisables, l’accessibilité, la performance et des tests.',
    },
  ];

  readonly stack = [
    { name: 'Angular 22', role: 'l’interface : pages, composants, routing' },
    { name: 'Node.js + Express 5', role: 'l’API REST et le contrôle des rôles' },
    { name: 'GitHub Actions', role: 'les tests automatiques à chaque push' },
    { name: 'GitHub Pages', role: 'l’hébergement du site sur fhemt.me' },
  ];
}
