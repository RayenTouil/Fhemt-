import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService, errorMessage } from '../../core/api';
import { AuthService } from '../../core/auth';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  templateUrl: './login.html',
})
export class Login {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  email = '';
  name = '';
  readonly loading = signal(false);
  readonly error = signal('');

  // Comptes de démonstration créés dans backend/data/seed/users.json
  readonly demo = [
    { email: 'amira@fhemt.tn', name: 'Amira', hint: 'étudiante · à l’aise en échantillonnage' },
    { email: 'youssef@fhemt.tn', name: 'Youssef', hint: 'étudiant · prérequis fragiles' },
    { email: 'teacher@fhemt.tn', name: 'Dr. Sami Ben Salah', hint: 'enseignant · carte de chaleur' },
  ];

  fill(account: { email: string; name: string }) {
    this.email = account.email;
    this.name = account.name;
  }

  submit() {
    this.error.set('');
    this.loading.set(true);
    this.api.login(this.email, this.name).subscribe({
      next: ({ user }) => {
        this.auth.setUser(user);
        this.router.navigateByUrl(user.role === 'student' ? '/dashboard' : '/teacher');
      },
      error: (err) => {
        this.error.set(errorMessage(err));
        this.loading.set(false);
      },
    });
  }
}
