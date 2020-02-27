import { Component, OnInit } from '@angular/core';
import { GoogleAnalyticsService } from '../google-analytics/google-analytics.service';
import { ConfigService } from '@gsrs-core/config';
import { Environment } from '@environment';
import { AuthService } from '@gsrs-core/auth';
import { Router } from '@angular/router';
import {environment} from "../../../environments/environment";

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  environment: Environment;
  baseDomain: string;
  isAuthenticated = false;
  contactEmail: string;
  isClosedWelcomeMessage = true;
  imageLoc: any;

  browseAll: string;
  application:string;
  chemicon: string;

  constructor(
    private gaService: GoogleAnalyticsService,
    private configService: ConfigService,
    private authService: AuthService,
    private router: Router
  ) {
    this.contactEmail = this.configService.configData.contactEmail;
  }

  ngOnInit() {
    this.application = `${environment.baseHref || '/'}assets/icons/home/icon_application.png`;
    this.browseAll = `${environment.baseHref || '/'}assets/icons/home/icon_registersubstance.png`;
    this.chemicon = `${environment.baseHref || '/'}assets/icons/home/icon_browseall.png`;

    this.authService.hasAnyRolesAsync('DataEntry', 'SuperDataEntry', 'Admin').subscribe(response => {
      this.isAuthenticated = response;
    });
    this.gaService.sendPageView(`Home`);
    this.environment = this.configService.environment;
    this.baseDomain = this.configService.configData.apiUrlDomain;
    this.isClosedWelcomeMessage = localStorage.getItem('isClosedWelcomeMessage') === 'true';
  }

  closeWelcomeMessage(): void {
    this.isClosedWelcomeMessage = true;
    localStorage.setItem('isClosedWelcomeMessage', this.isClosedWelcomeMessage.toString());
  }

  browseSubstances(): void {
    this.router.navigate(['/browse-substance']);
  }
}
