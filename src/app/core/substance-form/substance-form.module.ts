import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AccessManagerComponent } from './access-manager/access-manager.component';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatMenuModule } from '@angular/material/menu';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ReferencesManagerComponent } from './references-manager/references-manager.component';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { MatSelectModule } from '@angular/material/select';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatFormFieldModule,
    MatMenuModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatTabsModule,
    MatDividerModule,
    MatSelectModule
  ],
  declarations: [
    AccessManagerComponent,
    ReferencesManagerComponent
  ],
  exports: [
    AccessManagerComponent,
    ReferencesManagerComponent
  ]
})
export class SubstanceFormModule { }
