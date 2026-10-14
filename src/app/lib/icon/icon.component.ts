import { Component, computed, input } from '@angular/core';
import { IconDefinition } from '@fortawesome/fontawesome-common-types';

export type IconSize = 'xs' | 'sm' | 'xl' | '2xl';

@Component({
  selector: 'app-icon',
  templateUrl: './icon.component.html',
})
export class IconComponent {
  public readonly icon = input.required<IconDefinition>();
  public readonly size = input<IconSize>();

  protected readonly viewBox = computed(() => {
    const [width, height] = this.icon().icon;
    return `0 0 ${width} ${height}`;
  });
  protected readonly paths = computed(() => [this.icon().icon[4]].flat());
}
