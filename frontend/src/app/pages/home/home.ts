import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth';
import { MasteryBar } from '../../shared/mastery-bar/mastery-bar';

// Page d'accueil (publique) : le problème, l'exemple « même note, lacunes opposées »
// et les trois étapes de Fhemt ?.
@Component({
  selector: 'app-home',
  imports: [RouterLink, MasteryBar],
  templateUrl: './home.html',
})
export class Home {
  readonly auth = inject(AuthService);

  // Deux étudiants avec la même note (12/20) mais des lacunes opposées.
  // Les barres sont dessinées par le composant partagé <app-mastery-bar>.
  readonly students = [
    {
      name: 'Amira',
      levels: [
        { concept: 'Échantillonnage', level: 80 },
        { concept: 'Nyquist', level: 70 },
        { concept: 'Modulation', level: 20 },
      ],
    },
    {
      name: 'Youssef',
      levels: [
        { concept: 'Échantillonnage', level: 20 },
        { concept: 'Nyquist', level: 10 },
        { concept: 'Modulation', level: 80 },
      ],
    },
  ];
}
