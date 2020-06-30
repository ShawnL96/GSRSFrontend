import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GuidedSearchComponent } from './guided-search.component';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { QueryStatementComponent } from './query-statement/query-statement.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@NgModule({
  declarations: [
    GuidedSearchComponent,
    QueryStatementComponent
  ],
  imports: [
    CommonModule,
    MatCardModule,
    MatAutocompleteModule,
    MatInputModule,
    FormsModule,
    ReactiveFormsModule,
    MatSelectModule,
    MatTooltipModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    RouterModule
  ],
  exports: [
    GuidedSearchComponent
  ]
})
export class GuidedSearchModule { }
