import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, NgModule } from '@angular/core';
import { CheckboardModule, ColorWrap, EditableInputModule, SwatchModule } from 'ngx-color';

import { AlphaModule } from './alpha.component';
import { HueModule } from './hue.component'
import { SaturationModule } from './saturation.component';
import { isValidHex } from 'ngx-color';
import { SketchFieldsComponent } from './sketch-fields.component';
import { SketchPresetColorsComponent } from './sketch-preset-colors.component';

@Component({
  selector: 'color-sketch',
  templateUrl: './sketch.component.html',
  styleUrls: ['./sketch.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  preserveWhitespaces: false
})
export class SketchComponent extends ColorWrap {
  /** Remove alpha slider and options from picker */
  @Input() disableAlpha = false;
  /** Hex strings for default colors at bottom of picker */
  @Input() presetColors = [
    '#f44336',
    '#E91E63',
    '#9C27B0',
    '#673AB7',
    '#3F51B5',
    '#2196F3',
    '#03A9F4',
    '#00BCD4',
    '#009688',
    '#4CAF50',
    '#8BC34A',
    '#CDDC39',
    '#FFEB3B',
    '#FFC107',
    '#FF9800',

    '#FF5722',
    '#795548',
    '#9E9E9E',
    '#607D8B'
  ];
  /** Width of picker */
  @Input() width = 200;
  activeBackground: string;
  constructor() {
    super();
  }
  afterValidChange() {
    this.activeBackground = `rgba(${this.rgb.r}, ${this.rgb.g}, ${this.rgb.b}, ${this.rgb.a})`;
  }
  handleValueChange({ data, $event }) {
    this.handleChange(data, $event);
  }
  handleBlockChange({ hex, $event }) {
    if (isValidHex(hex)) {
      // this.hex = hex;
      this.handleChange(
        {
          hex,
          source: 'hex',
        },
        $event,
      );
    }
  }
}

@NgModule({
  declarations: [
    SketchComponent,
    SketchFieldsComponent,
    SketchPresetColorsComponent,
  ],
  exports: [
    SketchComponent,
    SketchFieldsComponent,
    SketchPresetColorsComponent,
  ],
  imports: [
    CommonModule,
    AlphaModule,
    CheckboardModule,
    EditableInputModule,
    HueModule,
    SaturationModule,
    SwatchModule,
  ],
})
export class ColorSketchModule { }
