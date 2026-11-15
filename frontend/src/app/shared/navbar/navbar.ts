import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/auth';
import { roleLabel } from '../../core/levels';
import { UiModeService } from '../../core/ui-mode';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
})
export class Navbar {
  readonly auth = inject(AuthService);
  readonly ui = inject(UiModeService);
  private readonly router = inject(Router);
  readonly roleLabel = roleLabel;

  logout() {
    this.auth.logout();
    this.router.navigateByUrl('/');
  }
}
