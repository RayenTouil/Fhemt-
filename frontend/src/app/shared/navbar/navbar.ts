import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/auth';
import { roleLabel } from '../../core/levels';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
})
export class Navbar {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly roleLabel = roleLabel;

  logout() {
    this.auth.logout();
    this.router.navigateByUrl('/');
  }
}
