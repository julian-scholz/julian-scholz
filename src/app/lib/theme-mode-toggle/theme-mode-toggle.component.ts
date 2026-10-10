import {
  Component,
  computed,
  inject
} from '@angular/core';
import { ThemeModeToggleService } from './theme-mode-toggle.service';
import { ThemeMode } from './utils/theme-mode-toggle.enum';

@Component({
  selector: 'app-theme-mode-toggle',
  templateUrl: './theme-mode-toggle.component.html',
  imports: [],
})
export class ThemeModeToggleComponent {
  private readonly themeModeToggleService: ThemeModeToggleService = inject(
    ThemeModeToggleService,
  );

  protected readonly isDarkMode = computed(
    () => this.themeModeToggleService.currentMode() === ThemeMode.DARK,
  );

  protected toggleThemeMode(): void {
    this.themeModeToggleService.toggleThemeMode();
  }
}
