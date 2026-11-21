import { Component, Directive, computed, inject, input } from '@angular/core';

let nextId = 0;

// Un champ de formulaire complet : le libellé, le champ lui-même, une aide et le message d'erreur.
// Les quatre sont reliés pour les lecteurs d'écran :
//  - <label for="…"> pointe vers le champ (cliquer sur le libellé place le curseur dans le champ) ;
//  - aria-describedby fait lire l'aide et l'erreur quand on arrive sur le champ ;
//  - aria-invalid="true" annonce que la valeur est refusée.
//
// Exemple :
//   <app-form-field label="E-mail" [error]="emailError()">
//     <input appFieldControl type="email" formControlName="email" />
//   </app-form-field>
@Component({
  selector: 'app-form-field',
  template: `
    <label class="field__label" [attr.for]="controlId">
      {{ label() }}
      @if (optional()) {
        <small class="muted">(facultatif)</small>
      }
    </label>
    <ng-content />
    @if (hint()) {
      <p class="field__hint" [id]="hintId">{{ hint() }}</p>
    }
    @if (error()) {
      <p class="field__error" [id]="errorId">{{ error() }}</p>
    }
  `,
  host: { class: 'field', '[class.field--invalid]': '!!error()' },
})
export class FormField {
  readonly label = input.required<string>();
  readonly hint = input('');
  readonly error = input('');
  readonly optional = input(false);

  // Un identifiant unique par champ de la page (champ-1, champ-2…).
  readonly controlId = `champ-${++nextId}`;
  readonly hintId = `${this.controlId}-aide`;
  readonly errorId = `${this.controlId}-erreur`;

  readonly describedBy = computed(() => {
    const ids = [this.hint() ? this.hintId : '', this.error() ? this.errorId : ''];
    return ids.filter(Boolean).join(' ') || null;
  });
}

// À poser sur le champ (input, textarea, select) placé dans <app-form-field>.
// La directive demande à Angular le FormField qui l'entoure (inject) et recopie sur le champ
// son id et ses attributs d'accessibilité : la page n'a rien à écrire elle-même.
@Directive({
  selector: '[appFieldControl]',
  host: {
    '[id]': 'field.controlId',
    '[attr.aria-describedby]': 'field.describedBy()',
    '[attr.aria-invalid]': 'field.error() ? "true" : null',
  },
})
export class FieldControl {
  readonly field = inject(FormField);
}
