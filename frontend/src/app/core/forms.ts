// Outils pour les formulaires (Reactive Forms d'Angular).
//
// Un formulaire « réactif » est décrit dans le fichier .ts : chaque champ est un FormControl avec
// ses règles (Validators.required, minLength…). Angular vérifie les règles à chaque frappe ; il
// reste à transformer l'erreur technique ({ minlength: { requiredLength: 2 } }) en phrase claire.
import { AbstractControl } from '@angular/forms';

// La phrase à afficher sous un champ, ou '' s'il n'y a rien à dire.
// On attend que l'utilisateur ait quitté le champ (touched) ou envoyé le formulaire (submitted) :
// afficher « obligatoire » avant même qu'il ait commencé à écrire serait agressif.
export function fieldError(control: AbstractControl, submitted: boolean): string {
  if (control.valid || !(control.touched || submitted)) return '';
  const e = control.errors ?? {};
  if (e['required']) return 'Ce champ est obligatoire.';
  if (e['pattern'] || e['email']) return 'Saisis une adresse e-mail valide (ex. : toi@supcom.tn).';
  if (e['minlength']) return `Au moins ${e['minlength'].requiredLength} caractères.`;
  if (e['maxlength']) return `${e['maxlength'].requiredLength} caractères maximum.`;
  return 'Valeur invalide.';
}
