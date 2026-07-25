import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { Animal } from '../../core/models/animal.model';

/**
 * Faixa branca com o nome silabado do animal e seu rosto num círculo.
 *
 * Fica imediatamente acima do banner de anúncio, aparece por 3 segundos e
 * some com fade (ESPECIFICACAO § 4.2). O rosto é obtido por recorte da
 * própria imagem do animal — `object-position` calibrado por animal —,
 * sem necessidade de assets adicionais.
 */
@Component({
  selector: 'fb-faixa-animal',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  template: `
    <div class="faixa" [class.visivel]="visivel()" aria-live="polite">
      @if (animal(); as a) {
        <span class="circulo">
          <img
            [src]="a.imagem"
            [alt]="''"
            [style.object-position]="a.rostoX + '% ' + a.rostoY + '%'"
            [style.transform]="'scale(' + a.rostoZoom + ')'"
          />
        </span>
        <span class="nome fb-fonte">{{ 'animais.' + a.id | translate }}</span>
      }
    </div>
  `,
  styleUrls: ['./faixa-animal.component.scss'],
})
export class FaixaAnimalComponent {
  readonly animal = input<Animal | null>(null);
  readonly visivel = input<boolean>(false);
}
