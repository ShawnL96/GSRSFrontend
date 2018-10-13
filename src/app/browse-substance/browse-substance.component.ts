import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SubstanceService } from '../substance/substance.service';
import { SubstanceDetail, SubstanceCode } from '../substance/substance.model';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { ConfigService } from '../config/config.service';
import * as _ from 'lodash';
import { Facet } from '../utils/facet.model';
import { LoadingService } from '../loading/loading.service';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { MainNotificationService } from '../main-notification/main-notification.service';
import { AppNotification, NotificationType } from '../main-notification/notification.model';

@Component({
  selector: 'app-browse-substance',
  templateUrl: './browse-substance.component.html',
  styleUrls: ['./browse-substance.component.scss']
})
export class BrowseSubstanceComponent implements OnInit {
  private _searchTerm: string;
  public substances: Array<SubstanceDetail>;
  public facets: Array<Facet>;
  private _facetParams: { [facetName: string]: { [facetValueLabel: string]: boolean } } = {};

  constructor(
    private activatedRoute: ActivatedRoute,
    private substanceService: SubstanceService,
    private sanitizer: DomSanitizer,
    public configService: ConfigService,
    private loadingService: LoadingService,
    private notificationService: MainNotificationService
  ) { }

  ngOnInit() {
    this.activatedRoute
      .queryParamMap
      .subscribe(params => {
        this._searchTerm = params.get('search_term') || '';
        this.searchSubstances();
      });
  }

  searchSubstances() {
    this.loadingService.setLoading(true);
    this.substanceService.getSubtanceDetails(this._searchTerm, true, this._facetParams).subscribe(pagingResponse => {
      this.substances = pagingResponse.content;
      if (pagingResponse.facets && pagingResponse.facets.length > 0) {
        let sortedFacets = _.orderBy(pagingResponse.facets, facet => {
          let valuesTotal = 0;
          facet.values.forEach(value => {
            valuesTotal += value.count;
          });
          return valuesTotal;
        }, 'desc');
        this.facets = _.take(sortedFacets, 10);
        sortedFacets = null;
      } else {
        this.facets = [];
      }

      this.substances.forEach((substance: SubstanceDetail) => {
        if (substance.codes && substance.codes.length > 0) {
          substance.codeSystemNames = [];
          substance.codeSystems = {};
          _.forEach(substance.codes, code => {
            if (substance.codeSystems[code.codeSystem]) {
              substance.codeSystems[code.codeSystem].push(code);
            } else {
              substance.codeSystems[code.codeSystem] = [code];
              substance.codeSystemNames.push(code.codeSystem);
            }
          });
        }
      });
      this.loadingService.setLoading(false);
    }, error => {
      console.log(error);
      const notification: AppNotification = {
        message: 'There was an error trying to retrieve substances. Please refresh and try again.',
        type: NotificationType.error,
        milisecondsToShow: 6000
      };
      this.loadingService.setLoading(false);
      this.notificationService.setNotification(notification);
    });
  }

  getSafeStructureImgUrl(structureId: string): SafeUrl {

    const imgUrl = `${this.configService.configData.apiBaseUrl}img/${structureId}.svg?size=150`;

    return this.sanitizer.bypassSecurityTrustUrl(imgUrl);
  }

  updateFacetSelection(event: MatCheckboxChange, facetName: string, facetValueLabel: string): void {

    if (this._facetParams[facetName] == null) {
      this._facetParams[facetName] = {};
    }

    this._facetParams[facetName][facetValueLabel] = event.checked;

    let facetHasSelectedValue = false;

    const facetValueKeys = Object.keys(this._facetParams[facetName]);
    for (let i = 0; i < facetValueKeys.length; i++) {
      if (this._facetParams[facetName][facetValueKeys[i]]) {
        facetHasSelectedValue = true;
        break;
      }
    }

    if (!facetHasSelectedValue) {
      this._facetParams[facetName] = undefined;
    }

    this.searchSubstances();

  }

  get searchTerm(): string {
    return this._searchTerm;
  }

  get facetParams(): { [facetName: string]: { [facetValueLabel: string]: boolean } } {
    return this._facetParams;
  }

}