// Tests des règles de validation partagées par les formulaires et le mode démo
// (les mêmes que backend/src/services/validation.js).
import { validateContact, validateProfile, validateQuestion } from './validation';

describe('validation', () => {
  it('accepte un message de contact complet et le nettoie', () => {
    const { value, errors } = validateContact({
      name: '  Amira ',
      email: 'AMIRA@fhemt.tn',
      subject: 'Suggestion',
      message: 'Plus de questions sur Nyquist, svp.',
    });
    expect(errors).toEqual({});
    expect(value.name).toBe('Amira');
    expect(value.email).toBe('amira@fhemt.tn');
  });

  it('donne un message clair pour chaque champ de contact refusé', () => {
    const { errors } = validateContact({
      name: 'A',
      email: 'pas-un-email',
      subject: 'Pub',
      message: '',
    });
    expect(errors['name']).toBe('Au moins 2 caractères.');
    expect(errors['email']).toContain('adresse e-mail valide');
    expect(errors['subject']).toBe('Choisis un sujet dans la liste.');
    expect(errors['message']).toBe('Ce champ est obligatoire.');
  });

  it('profil : ne valide que ce qui est envoyé', () => {
    expect(validateProfile({ preferences: { reduceMotion: true } }).errors).toEqual({});
    expect(
      validateProfile({ preferences: { uiMode: 'sombre' as never } }).errors['uiMode'],
    ).toBeTruthy();
  });

  it('question : 2 à 4 choix différents et une bonne réponse parmi eux', () => {
    const base = { conceptId: 'a', text: 'Une question assez longue ?', explanation: 'Parce que.' };
    expect(
      validateQuestion({ ...base, choices: ['Oui', 'Non'], correctIndex: 1 }, ['a']).errors,
    ).toEqual({});
    const bad = validateQuestion({ ...base, choices: ['Oui', 'oui'], correctIndex: 3 }, [
      'b',
    ]).errors;
    expect(bad['choices']).toBe('Deux choix sont identiques.');
    expect(bad['correctIndex']).toBeTruthy();
    expect(bad['conceptId']).toBeTruthy();
  });
});
