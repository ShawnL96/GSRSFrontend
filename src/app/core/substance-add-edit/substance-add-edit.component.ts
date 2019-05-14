import {
  Component,
  OnInit,
  AfterViewInit,
  ViewChildren,
  ViewContainerRef,
  QueryList,
  ViewChild,
  OnDestroy,
  HostListener
} from '@angular/core';
import { formSections } from './form-sections.constant';
import { ActivatedRoute, NavigationExtras, Router } from '@angular/router';
import { SubstanceService } from '../substance/substance.service';
import { SubstanceDetail } from '../substance/substance.model';
import { LoadingService } from '../loading/loading.service';
import { MainNotificationService } from '../main-notification/main-notification.service';
import { AppNotification, NotificationType } from '../main-notification/notification.model';
import { DynamicComponentLoader } from '../dynamic-component-loader/dynamic-component-loader.service';
import { GoogleAnalyticsService } from '../google-analytics/google-analytics.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-substance-add-edit',
  templateUrl: './substance-add-edit.component.html',
  styleUrls: ['./substance-add-edit.component.scss']
})
export class SubstanceAddEditComponent implements OnInit, AfterViewInit {
  id?: string;
  substance: SubstanceDetail;
  formSections: Array<string> = [];
  @ViewChildren('dynamicComponent', { read: ViewContainerRef }) dynamicComponents: QueryList<ViewContainerRef>;

  constructor(
    private activatedRoute: ActivatedRoute,
    private substanceService: SubstanceService,
    private loadingService: LoadingService,
    private mainNotificationService: MainNotificationService,
    private router: Router,
    private dynamicComponentLoader: DynamicComponentLoader,
    private gaService: GoogleAnalyticsService
  ) {
  }

  ngOnInit() {
    this.loadingService.setLoading(true);
    this.id = this.activatedRoute.snapshot.params['id'];
    if (this.id) {
      this.gaService.sendPageView(`Substance Edit`);
      this.getSubstanceDetails();
    } else {
      this.gaService.sendPageView(`Substance Register`);
      const kind = this.activatedRoute.snapshot.queryParamMap.get('kind') || 'chemical';
      this.substance = {};
      this.formSections = formSections[kind];
    }
  }

  ngAfterViewInit(): void {
    this.dynamicComponents.changes
      .subscribe(() => {
        this.dynamicComponents.forEach((cRef, index) => {
          this.dynamicComponentLoader
              .getComponentFactory<any>(this.formSections[index])
              .subscribe(componentFactory => {
                const ref = cRef.createComponent(componentFactory);
                ref.instance.substance = this.substance;
                ref.changeDetectorRef.detectChanges();
              });
        });
      });
  }

  getSubstanceDetails() {
    this.substanceService.getSubstanceDetails(this.id).subscribe(response => {
      if (response) {
        this.substance = response;
        this.formSections = formSections[this.substance.substanceClass];
      } else {
        this.handleSubstanceRetrivalError();
      }
      this.loadingService.setLoading(false);
    }, error => {
      this.gaService.sendException('getSubstanceDetails: error from API call');
      this.loadingService.setLoading(false);
      this.handleSubstanceRetrivalError();
    });
  }

  private handleSubstanceRetrivalError() {
    const notification: AppNotification = {
      message: 'The substance you\'re trying to edit doesn\'t exist.',
      type: NotificationType.error,
      milisecondsToShow: 4000
    };
    this.mainNotificationService.setNotification(notification);
    setTimeout(() => {
      this.router.navigate(['/substances/register']);
      this.substance = {};
      this.formSections = formSections.chemical;
    }, 5000);
  }
}
