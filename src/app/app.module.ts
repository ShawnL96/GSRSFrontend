import { BrowserModule } from '@angular/platform-browser';
import { NgModule, APP_INITIALIZER } from '@angular/core';
import { HttpClientModule, HttpClientJsonpModule  } from '@angular/common/http';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatCardModule } from '@angular/material/card';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatSliderModule } from '@angular/material/slider';
import { MatDialogModule } from '@angular/material/dialog';
import { MatListModule } from '@angular/material/list';

import { PageNotFoundComponent } from './page-not-found/page-not-found.component';
import { CoreComponent } from './core/core.component';
import { HomeComponent } from './home/home.component';
import { SubstancesBrowseComponent } from './substances-browse/substances-browse.component';
import { ClinicalTrialsBrowseComponent } from './clinical-trials-browse/clinical-trials-browse.component';
import { ClinicalTrialEditComponent } from './clinical-trial-edit/clinical-trial-edit.component';
import { MiniSearchComponent } from './mini-search/mini-search.component';
import { configServiceFactory } from './config/config.factory';
import { ConfigService } from './config/config.service';
import { LoadingModule } from './loading/loading.module';
import { MainNotificationModule } from './main-notification/main-notification.module';
import { StructureSearchComponent } from './structure-search/structure-search.component';
import { StructureEditorModule } from './structure-editor/structure-editor.module';
import { FileSelectModule } from 'file-select';
import { SubstanceDetailsComponent } from './substance-details/substance-details.component';
import { DynamicComponentLoaderModule } from './dynamic-component-loader/dynamic-component-loader.module';
import { dynamicComponentManifests } from './app-dynamic-component-manifests';
import { ScrollNavModule } from './scroll-nav/scroll-nav.module';

@NgModule({
  declarations: [
    AppComponent,
    PageNotFoundComponent,
    CoreComponent,
    HomeComponent,
    SubstancesBrowseComponent,
    StructureSearchComponent,
    SubstanceDetailsComponent,
    ClinicalTrialsBrowseComponent,
    ClinicalTrialEditComponent,
    MiniSearchComponent
  ],
  imports: [
    BrowserModule.withServerTransition({ appId: 'gsrs' }),
    AppRoutingModule,
    BrowserAnimationsModule,
    MatToolbarModule,
    MatSidenavModule,
    MatCardModule,
    HttpClientModule,
    MatAutocompleteModule,
    ReactiveFormsModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    HttpClientModule,
    HttpClientJsonpModule,
    MatChipsModule,
    MatBadgeModule,
    MatExpansionModule,
    MatCheckboxModule,
    LoadingModule,
    MainNotificationModule,
    MatTableModule,
    MatPaginatorModule,
    MatSelectModule,
    MatSliderModule,
    MatDialogModule,
    StructureEditorModule,
    FileSelectModule,
    MatListModule,
    DynamicComponentLoaderModule.forRoot(dynamicComponentManifests),
    ScrollNavModule
  ],
  providers: [
    ConfigService,
        {
            provide: APP_INITIALIZER,
            useFactory: configServiceFactory,
            deps: [ConfigService],
            multi: true
        }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
