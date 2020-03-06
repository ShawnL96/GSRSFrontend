import { Component, OnInit, ViewChild, AfterViewInit, HostListener, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, NavigationExtras } from '@angular/router';
import { SubstanceService } from '../substance/substance.service';
import { SubstanceDetail, SubstanceName, SubstanceCode, SubstanceRelationship } from '../substance/substance.model';
import { ConfigService } from '../config/config.service';
import * as _ from 'lodash';
import { Facet } from '../utils/facet.model';
import { LoadingService } from '../loading/loading.service';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { MainNotificationService } from '../main-notification/main-notification.service';
import { AppNotification, NotificationType } from '../main-notification/notification.model';
import { MatDialog, PageEvent } from '@angular/material';
import { UtilsService } from '../utils/utils.service';
import { MatSidenav } from '@angular/material/sidenav';
import { SafeUrl } from '@angular/platform-browser';
import { SubstanceFacetParam } from '../substance/substance-facet-param.model';
import { StructureImageModalComponent } from '../structure/structure-image-modal/structure-image-modal.component';
import { GoogleAnalyticsService } from '../google-analytics/google-analytics.service';
import { environment } from '../../../environments/environment';
import { AuthService } from '../auth/auth.service';
import { Auth } from '../auth/auth.model';
import { searchSortValues } from '../utils/search-sort-values';
import { OverlayContainer } from '@angular/cdk/overlay';
import { Location, LocationStrategy } from '@angular/common';
import { StructureService } from '@gsrs-core/structure';
import { Subscription, Observable, Subject } from 'rxjs';
import { take, debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-substances-browse',
  templateUrl: './substances-browse.component.html',
  styleUrls: ['./substances-browse.component.scss']
})
export class SubstancesBrowseComponent implements OnInit, AfterViewInit, OnDestroy {
  private privateSearchTerm?: string;
  private privateStructureSearchTerm?: string;
  private privateSequenceSearchTerm?: string;
  private privateSearchType?: string;
  private privateSearchCutoff?: number;
  private privateSearchSeqType?: string;
  public substances: Array<SubstanceDetail>;
  public exactMatchSubstances: Array<SubstanceDetail>;
  public facets: Array<Facet>;
  public displayFacets: Array<DisplayFacet> = [];
  private privateFacetParams: SubstanceFacetParam;
  pageIndex: number;
  pageSize: number;
  totalSubstances: number;
  isLoading = true;
  isError = false;
  @ViewChild('matSideNavInstance', { static: false }) matSideNav: MatSidenav;
  hasBackdrop = false;
  view = 'cards';
  facetString: string;
  displayedColumns: string[] = ['name', 'approvalID', 'names', 'codes', 'actions'];
  public smiles: string;
  private argsHash?: number;
  public auth?: Auth;
  public order: string;
  public sortValues = searchSortValues;
  showAudit: boolean;
  public facetBuilder: SubstanceFacetParam;
  searchText: { [faceName: string]: { value: string, isLoading: boolean } } = {};
  private overlayContainer: HTMLElement;
  toggle: Array<boolean> = [];
  searchtext2: string;
  private subscriptions: Array<Subscription> = [];
  isAdmin: boolean;
  showExactMatches = false;
  names: { [substanceId: string]: Array<SubstanceName> } = {};
  codes: {
    [substanceId: string]: {
      codeSystemNames?: Array<string>
      codeSystems?: { [codeSystem: string]: Array<SubstanceCode> }
    }
  } = {};
  private facetSearchChanged = new Subject<{ index: number, query: any}>();
  private activeSearchedFaced: Facet;

  constructor(
    private activatedRoute: ActivatedRoute,
    private substanceService: SubstanceService,
    public configService: ConfigService,
    private loadingService: LoadingService,
    private notificationService: MainNotificationService,
    public utilsService: UtilsService,
    private router: Router,
    private dialog: MatDialog,
    public gaService: GoogleAnalyticsService,
    public authService: AuthService,
    private structureService: StructureService,
    private overlayContainerService: OverlayContainer,
    private location: Location,
    private locationStrategy: LocationStrategy
  ) {
    this.privateFacetParams = {};
    this.facetBuilder = {};
  }

  ngOnInit() {
    this.gaService.sendPageView('Browse Substances');
    this.pageSize = 10;
    this.pageIndex = 0;
    this.facets = [];

    this.privateSearchTerm = this.activatedRoute.snapshot.queryParams['search'] || '';
    this.privateStructureSearchTerm = this.activatedRoute.snapshot.queryParams['structure_search'] || '';
    this.privateSequenceSearchTerm = this.activatedRoute.snapshot.queryParams['sequence_search'] || '';
    this.privateSearchType = this.activatedRoute.snapshot.queryParams['type'] || '';
    this.privateSearchCutoff = Number(this.activatedRoute.snapshot.queryParams['cutoff']) || 0;
    this.privateSearchSeqType = this.activatedRoute.snapshot.queryParams['seq_type'] || '';
    this.smiles = this.activatedRoute.snapshot.queryParams['smiles'] || '';
    this.order = this.activatedRoute.snapshot.queryParams['order'] || '$root_lastEdited';
    this.view = this.activatedRoute.snapshot.queryParams['view'] || 'cards';
    this.pageSize = parseInt(this.activatedRoute.snapshot.queryParams['pageSize'], null) || 10;
    this.pageIndex = parseInt(this.activatedRoute.snapshot.queryParams['pageIndex'], null) || 0;
    this.facetString = this.activatedRoute.snapshot.queryParams['facets'] || '';
    this.facetsFromParams();
    this.searchSubstances();
    this.overlayContainer = this.overlayContainerService.getContainerElement();
    this.isAdmin = this.authService.hasAnyRoles('Updater', 'SuperUpdater');

    this.facetSearchChanged.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      switchMap(event => {
        const facet = this.facets[event.index];
        if (event.query.length > 0) {
          const processed = facet.name.replace(' ', '+');
          return this.substanceService.filterFacets(event.query, processed).pipe(take(1));
        } else {
          return this.substanceService.retrieveFacetValues(facet).pipe(take(1));
        }
      })
    ).subscribe(response => {
      this.activeSearchedFaced.values = this.activeSearchedFaced.values.filter(value => {
        let removeFacet = true;

        let isInSearhResults = false;

        for (let i = 0; i < response.content.length; i++) {
          if (response.content[i].label === value.label) {
            isInSearhResults = true;
            break;
          }
        }

        if (!isInSearhResults
          && this.facetParams[this.activeSearchedFaced.name] != null
          && (this.facetParams[this.activeSearchedFaced.name].params[value.label] === true
            || this.facetParams[this.activeSearchedFaced.name].params[value.label] === false)) {
              removeFacet = false;
            }

        return !removeFacet;
      });
      this.activeSearchedFaced.values = this.activeSearchedFaced.values.concat(response.content);
      this.searchText[this.activeSearchedFaced.name].isLoading = false;
    }, error => {
      this.searchText[this.activeSearchedFaced.name].isLoading = false;
    });
  }

  ngAfterViewInit() {
    const openSubscription = this.matSideNav.openedStart.subscribe(() => {
      this.utilsService.handleMatSidenavOpen(1100);
    });
    this.subscriptions.push(openSubscription);
    const closeSubscription = this.matSideNav.closedStart.subscribe(() => {
      this.utilsService.handleMatSidenavClose();
    });
    this.subscriptions.push(closeSubscription);
    this.isAdmin = this.authService.hasAnyRoles('Updater', 'SuperUpdater');
  }

  facetsFromParams() {
    if (this.facetString !== '') {
      const categoryArray = this.facetString.split(',');
      for (let i = 0; i < (categoryArray.length); i++) {
        const categorySplit = categoryArray[i].split('*');
        const category = categorySplit[0];
        const fieldsArr = categorySplit[1].split('+');
        const params: { [facetValueLabel: string]: boolean } = {};
        let hasSelections = false;
        for (let j = 0; j < fieldsArr.length; j++) {
          const field = fieldsArr[j].split('.');
          if (field[1] === 'true') {
            params[field[0]] = true;
            hasSelections = true;
          } else if (field[1] === 'false') {
            params[field[0]] = false;
            hasSelections = true;
          }
        }
        if (hasSelections === true) {
          this.facetBuilder[category] = { params: params, hasSelections: true, isAllMatch: false };
          const paramsString = JSON.stringify(params);
          const newHash = this.utilsService.hashCode(paramsString, this.facetBuilder[category].isAllMatch.toString());
          this.facetBuilder[category].currentStateHash = newHash;
        }
      }
      this.privateFacetParams = this.facetBuilder;
    }

  }

  ngOnDestroy() {
    this.subscriptions.forEach(subscription => {
      subscription.unsubscribe();
    });
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.processResponsiveness();
  }

  changePage(pageEvent: PageEvent) {

    let eventAction;
    let eventValue;

    if (this.pageSize !== pageEvent.pageSize) {
      eventAction = 'select:page-size';
      eventValue = pageEvent.pageSize;
    } else if (this.pageIndex !== pageEvent.pageIndex) {
      eventAction = 'icon-button:page-number';
      eventValue = pageEvent.pageIndex + 1;
    }

    this.gaService.sendEvent('substancesContent', eventAction, 'pager', eventValue);

    this.pageSize = pageEvent.pageSize;
    this.pageIndex = pageEvent.pageIndex;
    this.populateUrlQueryParameters();
    this.searchSubstances();
  }

  searchSubstances() {

    const newArgsHash = this.utilsService.hashCode(
      this.privateSearchTerm,
      this.privateStructureSearchTerm,
      this.privateSequenceSearchTerm,
      this.privateSearchCutoff,
      this.privateSearchType,
      this.privateSearchSeqType,
      this.pageSize,
      this.order,
      this.privateFacetParams,
      (this.pageIndex * this.pageSize),
    );
    if (this.argsHash == null || this.argsHash !== newArgsHash) {
      this.isLoading = true;
      this.loadingService.setLoading(true);
      this.argsHash = newArgsHash;
      const skip = this.pageIndex * this.pageSize;
      const subscription = this.substanceService.getSubstancesSummaries({
        searchTerm: this.privateSearchTerm,
        structureSearchTerm: this.privateStructureSearchTerm,
        sequenceSearchTerm: this.privateSequenceSearchTerm,
        cutoff: this.privateSearchCutoff,
        type: this.privateSearchType,
        seqType: this.privateSearchSeqType,
        order: this.order,
        pageSize: this.pageSize,
        facets: this.privateFacetParams,
        skip: skip
      })
        .subscribe(pagingResponse => {
          this.isError = false;

          if (pagingResponse.exactMatches && pagingResponse.exactMatches.length > 0
            && pagingResponse.skip === 0
            && (!pagingResponse.sideway || pagingResponse.sideway.length < 2)
          ) {
            this.exactMatchSubstances = pagingResponse.exactMatches;
            this.showExactMatches = true;
          }

          this.substances = pagingResponse.content;
          this.totalSubstances = pagingResponse.total;
          if (pagingResponse.facets && pagingResponse.facets.length > 0) {
            this.populateFacets(pagingResponse.facets);
          }
        }, error => {
          this.gaService.sendException('getSubstancesDetails: error from API cal');
          const notification: AppNotification = {
            message: 'There was an error trying to retrieve substances. Please refresh and try again.',
            type: NotificationType.error,
            milisecondsToShow: 6000
          };
          this.isError = true;
          this.isLoading = false;
          this.loadingService.setLoading(this.isLoading);
          this.notificationService.setNotification(notification);
        }, () => {
          subscription.unsubscribe();
          if (this.exactMatchSubstances && this.exactMatchSubstances.length > 0) {
            this.exactMatchSubstances.forEach(substance => {
              this.setSubstanceNames(substance.uuid);
              this.setSubstanceCodes(substance.uuid);
            });

          }
          this.substances.forEach(substance => {
            this.setSubstanceNames(substance.uuid);
            this.setSubstanceCodes(substance.uuid);
          });
          this.isLoading = false;
          this.loadingService.setLoading(this.isLoading);
        });
    }

  }

  setSubstanceNames(substanceId: string): void {
    this.loadingService.setLoading(true);
    this.substanceService.getSubstanceNames(substanceId).pipe(take(1)).subscribe(names => {
      this.names[substanceId] = names;
      this.loadingService.setLoading(false);
    }, error => {
      this.loadingService.setLoading(false);
    });
  }

  setSubstanceCodes(substanceId: string): void {
    this.loadingService.setLoading(true);
    this.substanceService.getSubstanceCodes(substanceId).pipe(take(1)).subscribe(codes => {
      if (codes && codes.length > 0) {
        this.codes[substanceId] = {
          codeSystemNames: [],
          codeSystems: {}
        };
        codes.forEach(code => {
          if (this.codes[substanceId].codeSystems[code.codeSystem]) {
            this.codes[substanceId].codeSystems[code.codeSystem].push(code);
          } else {
            this.codes[substanceId].codeSystems[code.codeSystem] = [code];
            this.codes[substanceId].codeSystemNames.push(code.codeSystem);
          }
        });
        this.codes[substanceId].codeSystemNames = this.sortCodeSystems(this.codes[substanceId].codeSystemNames);
      }
      this.loadingService.setLoading(false);
    }, error => {
      this.loadingService.setLoading(false);
    });
  }

  populateUrlQueryParameters(): void {
    const navigationExtras: NavigationExtras = {
      queryParams: {}
    };

    const catArr = [];
    let facetString = '';
    for (const key of Object.keys(this.privateFacetParams)) {
      if (this.privateFacetParams[key] !== undefined && this.privateFacetParams[key].hasSelections === true) {
        const cat = this.privateFacetParams[key];
        const valArr = [];
        for (const subkey of Object.keys(cat.params)) {
          if (typeof cat.params[subkey] === 'boolean') {
            valArr.push(subkey + '.' + cat.params[subkey]);
          }
        }
        catArr.push(key + '*' + valArr.join('+'));
        const paramsString = JSON.stringify(this.privateFacetParams[key].params);
        const newHash = this.utilsService.hashCode(paramsString, this.privateFacetParams[key].isAllMatch.toString());
        this.privateFacetParams[key].currentStateHash = newHash;
        this.privateFacetParams[key].isUpdated = false;
      }
    }
    facetString = catArr.join(',');
    navigationExtras.queryParams['search'] = this.privateSearchTerm;
    navigationExtras.queryParams['structure_search'] = this.privateStructureSearchTerm;
    navigationExtras.queryParams['sequence_search'] = this.privateSequenceSearchTerm;
    navigationExtras.queryParams['cutoff'] = this.privateSearchCutoff;
    navigationExtras.queryParams['type'] = this.privateSearchType;
    navigationExtras.queryParams['seq_type'] = this.privateSearchSeqType;
    navigationExtras.queryParams['smiles'] = this.smiles;
    navigationExtras.queryParams['order'] = this.order;
    navigationExtras.queryParams['pageSize'] = this.pageSize;
    navigationExtras.queryParams['pageIndex'] = this.pageIndex;
    navigationExtras.queryParams['facets'] = facetString;
    navigationExtras.queryParams['skip'] = this.pageIndex * this.pageSize;
    navigationExtras.queryParams['view'] = this.view;

    const urlTree = this.router.createUrlTree([], {
      queryParams: navigationExtras.queryParams,
      queryParamsHandling: 'merge',
      preserveFragment: true
    });
    this.location.go(urlTree.toString());
  }

  private populateFacets(facets: Array<Facet>): void {
    const subscription = this.authService.getAuth().subscribe(auth => {

      let newFacets = [];
      this.auth = auth;
      this.showAudit = this.authService.hasRoles('admin');
      if (this.configService.configData.facets != null) {

        const facetKeys = Object.keys(this.configService.configData.facets) || [];

        facetKeys.forEach(facetKey => {
          if (this.configService.configData.facets[facetKey].length
            && (facetKey === 'default' || this.authService.hasRoles(facetKey))) {
            this.configService.configData.facets[facetKey].forEach(facet => {
              for (let facetIndex = 0; facetIndex < facets.length; facetIndex++) {
                this.toggle[facetIndex] = true;
                if (facet === facets[facetIndex].name) {
                  if (facets[facetIndex].values != null && facets[facetIndex].values.length) {
                    let hasValues = false;
                    for (let valueIndex = 0; valueIndex < facets[facetIndex].values.length; valueIndex++) {
                      if (facets[facetIndex].values[valueIndex].count) {
                        hasValues = true;
                        break;
                      }
                    }

                    if (hasValues) {
                      const facetToAdd = facets.splice(facetIndex, 1);
                      facetIndex--;
                      newFacets.push(facetToAdd[0]);
                      this.searchText[facetToAdd[0].name] = { value: '', isLoading: false};
                    }
                  }
                  break;
                }
              }
            });
          }

        });

      }

/* Commented out for now, would show extra facets if not enough shown
      if (newFacets.length < 15) {
        const numFillFacets = 15 - newFacets.length;
        let sortedFacets = _.orderBy(facets, facet => {
          let valuesTotal = 0;
          facet.values.forEach(value => {
            valuesTotal += value.count;
          });
          return valuesTotal;
        }, 'desc');
        const additionalFacets = _.take(sortedFacets, numFillFacets);
        newFacets = newFacets.concat(additionalFacets);
        sortedFacets = null;
      }
*/

      if (newFacets.length > 0) {
        this.processResponsiveness();
      } else {
        this.matSideNav.close();
      }
      this.facets = newFacets;
      this.cleanFacets();
    });
    this.subscriptions.push(subscription);
  }

  applyFacetsFilter(facetName: string) {
    const eventLabel = environment.isAnalyticsPrivate ? 'facet' : `${facetName}`;
    let eventValue = 0;
    Object.keys(this.privateFacetParams).forEach(key => {
      if (this.privateFacetParams[key] && this.privateFacetParams[key].params) {
        eventValue = eventValue + Object.keys(this.privateFacetParams[key].params).length || 0;
      }
    });
    this.gaService.sendEvent('substancesFiltering', 'button:apply-facet', eventLabel, eventValue);
    this.populateUrlQueryParameters();
    this.searchSubstances();
    this.getLabelFacets();
  }

  removeFacet(facet: any): void {
    const mockEvent = { 'checked': false };
    this.updateFacetSelection(mockEvent, facet.type, facet.val, facet.bool);

    setTimeout(() => {
      this.applyFacetsFilter(facet.type);
    });
  }

  getLabelFacets() {
    this.displayFacets = [];
    Object.keys(this.privateFacetParams).forEach(key => {
      if (this.privateFacetParams[key] && this.privateFacetParams[key].params) {
        Object.keys(this.privateFacetParams[key].params).forEach(sub => {
          if (this.privateFacetParams[key].params[sub] !== undefined) {
            const facet = {
              'type': key,
              'val': sub,
              'bool': this.privateFacetParams[key].params[sub]
            };
            this.displayFacets.push(facet);
          }
        });
      }
    });
  }

  getSafeStructureImgUrl(structureId: string, size: number = 150): SafeUrl {
    return this.utilsService.getSafeStructureImgUrl(structureId, size);
  }

  getSafeStructureImgUrlLarge(structureId: string, size: number = 175): SafeUrl {
    return this.utilsService.getSafeStructureImgUrl(structureId, size);
  }


  updateFacetSelection(
    event: any,
    facetName: string,
    facetValueLabel: string,
    include: boolean
  ): void {
    const eventLabel = environment.isAnalyticsPrivate ? 'facet' : `${facetName} > ${facetValueLabel}`;
    const eventValue = event.checked ? 1 : 0;
    const eventAction = include ? 'include' : 'exclude';
    this.gaService.sendEvent('substancesFiltering', `check:facet-${eventAction}`, eventLabel, eventValue);

    let paramsString: string;
    let isAllMatchString: string;

    if (this.privateFacetParams[facetName] == null) {
      this.privateFacetParams[facetName] = {
        params: {},
        isAllMatch: false
      };
      paramsString = JSON.stringify(this.privateFacetParams[facetName].params);
      isAllMatchString = this.privateFacetParams[facetName].isAllMatch.toString();
      const stateHash = this.utilsService.hashCode(paramsString, isAllMatchString);
      this.privateFacetParams[facetName].currentStateHash = stateHash;
    }

    if (include) {
      this.privateFacetParams[facetName].params[facetValueLabel] = event.checked || undefined;
    } else {
      this.privateFacetParams[facetName].params[facetValueLabel] = event.checked === true ? false : undefined;
    }

    let hasSelections = false;
    let hasExcludeOption = false;
    let includeOptionsLength = 0;

    const facetValueKeys = Object.keys(this.privateFacetParams[facetName].params);
    for (let i = 0; i < facetValueKeys.length; i++) {
      if (this.privateFacetParams[facetName].params[facetValueKeys[i]] != null) {
        hasSelections = true;
        if (this.privateFacetParams[facetName].params[facetValueKeys[i]] === false) {
          hasExcludeOption = true;
        } else {
          includeOptionsLength++;
        }
      }
    }

    this.privateFacetParams[facetName].hasSelections = hasSelections;

    if (!hasExcludeOption && includeOptionsLength > 1) {
      this.privateFacetParams[facetName].showAllMatchOption = true;
    } else {
      this.privateFacetParams[facetName].showAllMatchOption = false;
      this.privateFacetParams[facetName].isAllMatch = false;
    }

    paramsString = JSON.stringify(this.privateFacetParams[facetName].params);
    isAllMatchString = this.privateFacetParams[facetName].isAllMatch.toString();
    const newHash = this.utilsService.hashCode(paramsString, isAllMatchString);
    this.privateFacetParams[facetName].isUpdated = newHash !== this.privateFacetParams[facetName].currentStateHash;

    this.pageIndex = 0;
  }

  clearFacetSelection(
    facetName?: string
  ) {

    const eventLabel = environment.isAnalyticsPrivate ? 'facet' : `facet: ${facetName}`;
    let eventValue = 0;

    const facetKeys = facetName != null ? [facetName] : Object.keys(this.privateFacetParams);

    if (facetKeys != null && facetKeys.length) {
      facetKeys.forEach(facetKey => {
        if (this.privateFacetParams[facetKey] != null && this.privateFacetParams[facetKey].params != null) {
          const facetValueKeys = Object.keys(this.privateFacetParams[facetKey].params);
          facetValueKeys.forEach(facetParam => {
            eventValue++;
            this.privateFacetParams[facetKey].params[facetParam] = null;
          });

          this.privateFacetParams[facetKey].isAllMatch = false;
          this.privateFacetParams[facetKey].showAllMatchOption = false;
          this.privateFacetParams[facetKey].hasSelections = false;

          const paramsString = JSON.stringify(this.privateFacetParams[facetName].params);
          const isAllMatchString = this.privateFacetParams[facetName].isAllMatch.toString();
          const newHash = this.utilsService.hashCode(paramsString, isAllMatchString);
          this.privateFacetParams[facetName].isUpdated = newHash !== this.privateFacetParams[facetName].currentStateHash;
        }
      });
    }

    this.gaService.sendEvent('substancesFiltering', 'button:clear-facet', eventLabel, eventValue);
  }

  cleanFacets(): void {
    if (this.privateFacetParams != null) {
      const facetParamsKeys = Object.keys(this.privateFacetParams);
      if (facetParamsKeys && facetParamsKeys.length > 0) {
        facetParamsKeys.forEach(key => {
          if (this.privateFacetParams[key]) {
            if ((Object.keys(this.privateFacetParams[key].params).length < 1) || (this.privateFacetParams[key].hasSelections === false)) {
              this.privateFacetParams[key] = undefined;
            }
          }
        });
      }
      this.getLabelFacets();
    }
  }

  editStructureSearch(): void {
    const eventLabel = environment.isAnalyticsPrivate ? 'structure search term' :
      `${this.privateStructureSearchTerm}-${this.privateSearchType}-${this.privateSearchCutoff}`;
    this.gaService.sendEvent('substancesFiltering', 'icon-button:edit-structure-search', eventLabel);

    const navigationExtras: NavigationExtras = {
      queryParams: {}
    };

    navigationExtras.queryParams['structure'] = this.privateStructureSearchTerm || null;
    navigationExtras.queryParams['type'] = this.privateSearchType || null;

    if (this.privateSearchType === 'similarity') {
      navigationExtras.queryParams['cutoff'] = this.privateSearchCutoff || 0;
    }

    this.router.navigate(['/structure-search'], navigationExtras);
  }

  clearStructureSearch(): void {

    const eventLabel = environment.isAnalyticsPrivate ? 'structure search term' :
      `${this.privateStructureSearchTerm}-${this.privateSearchType}-${this.privateSearchCutoff}`;
    this.gaService.sendEvent('substancesFiltering', 'icon-button:clear-structure-search', eventLabel);

    this.privateStructureSearchTerm = '';
    this.privateSearchType = '';
    this.privateSearchCutoff = 0;
    this.smiles = '';
    this.pageIndex = 0;

    this.populateUrlQueryParameters();
    this.searchSubstances();
  }

  editSequenceSearh(): void {
    const eventLabel = environment.isAnalyticsPrivate ? 'sequence search term' :
      `${this.privateSequenceSearchTerm}-${this.privateSearchType}-${this.privateSearchCutoff}-${this.privateSearchSeqType}`;
    this.gaService.sendEvent('substancesFiltering', 'icon-button:edit-sequence-search', eventLabel);

    const navigationExtras: NavigationExtras = {
      queryParams: {}
    };

    navigationExtras.queryParams['sequence'] = this.privateSequenceSearchTerm || null;
    navigationExtras.queryParams['type'] = this.privateSearchType || null;
    navigationExtras.queryParams['cutoff'] = this.privateSearchCutoff || 0;
    navigationExtras.queryParams['seq_type'] = this.privateSearchSeqType || null;

    this.router.navigate(['/sequence-search'], navigationExtras);
  }

  clearSequenceSearch(): void {

    const eventLabel = environment.isAnalyticsPrivate ? 'sequence search term' :
      `${this.privateSequenceSearchTerm}-${this.privateSearchType}-${this.privateSearchCutoff}-${this.privateSearchSeqType}`;
    this.gaService.sendEvent('substancesFiltering', 'icon-button:clear-sequence-search', eventLabel);

    this.privateSequenceSearchTerm = '';
    this.privateSearchType = '';
    this.privateSearchCutoff = 0;
    this.privateSearchSeqType = '';
    this.pageIndex = 0;

    this.populateUrlQueryParameters();
    this.searchSubstances();
  }

  clearSearch(): void {

    const eventLabel = environment.isAnalyticsPrivate ? 'search term' : this.privateSearchTerm;
    this.gaService.sendEvent('substancesFiltering', 'icon-button:clear-search', eventLabel);

    this.privateSearchTerm = '';
    this.pageIndex = 0;

    this.populateUrlQueryParameters();
    this.searchSubstances();
  }

  clearFilters(): void {
    this.clearFacetSelection();
    if (this.privateStructureSearchTerm != null && this.privateStructureSearchTerm !== '') {
      this.clearStructureSearch();
    } else if (this.privateSequenceSearchTerm != null && this.privateSequenceSearchTerm !== '') {
      this.clearSequenceSearch();
    } else {
      this.clearSearch();
    }
  }

  get searchTerm(): string {
    return this.privateSearchTerm;
  }

  get structureSearchTerm(): string {
    return this.privateStructureSearchTerm;
  }

  get sequenceSearchTerm(): string {
    return this.privateSequenceSearchTerm;
  }

  get searchType(): string {
    return this.privateSearchType;
  }

  get searchCutoff(): number {
    return this.privateSearchCutoff;
  }

  get searchSeqType(): string {
    return this.privateSearchSeqType;
  }

  get facetParams(): SubstanceFacetParam | { showAllMatchOption?: boolean } {
    return this.privateFacetParams;
  }

  private processResponsiveness = () => {
    if (window) {
      if (window.innerWidth < 1100) {
        this.matSideNav.close();
        this.hasBackdrop = true;
      } else {
        this.matSideNav.open();
        this.hasBackdrop = false;
      }
    }
  }

  openSideNav() {
    this.gaService.sendEvent('substancesFiltering', 'button:sidenav', 'open');
    this.matSideNav.open();
  }

  updateView(event): void {
    this.gaService.sendEvent('substancesContent', 'button:view-update', event.value);
    this.view = event.value;
  }

  getSequenceDisplay(sequence: string): string {
    if (sequence.length < 16) {
      return sequence;
    } else {
      return `${sequence.substr(0, 15)}...`;
    }
  }

  openImageModal(substance: SubstanceDetail): void {
    const eventLabel = environment.isAnalyticsPrivate ? 'substance' : substance._name;

    this.gaService.sendEvent('substancesContent', 'link:structure-zoom', eventLabel);

    let data: any;

    if (substance.substanceClass === 'chemical') {
      data = {
        structure: substance.structure.id,
        smiles: substance.structure.smiles,
        uuid: substance.uuid,
        names: substance.names
      };
    } else {
      data = {
        structure: substance.polymer.displayStructure.id,
        names: substance.names
      };
    }

    const dialogRef = this.dialog.open(StructureImageModalComponent, {
      height: '90%',
      width: '650px',
      panelClass: 'structure-image-panel',
      data: data
    });

    this.overlayContainer.style.zIndex = '1002';

    const subscription = dialogRef.afterClosed().subscribe(() => {
      this.overlayContainer.style.zIndex = null;
      subscription.unsubscribe();
    }, () => {
      this.overlayContainer.style.zIndex = null;
      subscription.unsubscribe();
    });
  }

  sendFacetsEvent(event: MatCheckboxChange, facetName: string): void {
    const eventLabel = environment.isAnalyticsPrivate ? 'facet' : `${facetName}`;
    const eventValue = event.checked ? 1 : 0;
    this.gaService.sendEvent('substancesFiltering', 'check:match-all', eventLabel, eventValue);
  }

  getMol(id: string, filename: string): void {
    const subscription = this.structureService.downloadMolfile(id).subscribe(response => {
      this.downloadFile(response, filename);
      subscription.unsubscribe();
    }, error => {
      subscription.unsubscribe();
    });
  }

  getFasta(id: string, filename: string): void {
    const subscription = this.substanceService.getFasta(id).subscribe(response => {
      this.downloadFile(response, filename);
      subscription.unsubscribe();
    }, error => {
      subscription.unsubscribe();
    });
  }

  moreFacets(index: number, facet: Facet) {
    const subscription = this.substanceService.retrieveNextFacetValues(this.facets[index]).subscribe(resp => {
      this.facets[index].$next = resp.$next;
      this.facets[index].values = this.facets[index].values.concat(resp.content);
      this.facets[index].$fetched = this.facets[index].values;
      this.facets[index].$total = resp.ftotal;
      subscription.unsubscribe();
    }, error => {
      subscription.unsubscribe();
    });
  }

  lessFacets(index: number) {
    const subscription = this.substanceService.retrieveFacetValues(this.facets[index]).subscribe(response => {
      this.facets[index].values = response.content;
      this.facets[index].$fetched = response.content;
      this.facets[index].$next = response.$next;
      subscription.unsubscribe();
    }, error => {
      subscription.unsubscribe();
    });
  }

  filterFacets(index: number, event: any, faceName: string): void {
    this.searchText[faceName].isLoading = true;
    this.activeSearchedFaced = this.facets[index];
    this.facetSearchChanged.next({index: index, query: event});
  }

  clearFacetSearch(index: number, facetName: string): void {
    this.searchText[facetName].value = '';
    this.filterFacets(index, '', facetName);
  }

  downloadFile(response: any, filename: string): void {
    const dataType = response.type;
    const binaryData = [];
    binaryData.push(response);
    const downloadLink = document.createElement('a');
    downloadLink.href = window.URL.createObjectURL(new Blob(binaryData, { type: dataType }));
    downloadLink.setAttribute('download', filename);
    document.body.appendChild(downloadLink);
    downloadLink.click();
  }

  sortCodeSystems(codes: Array<string>): Array<string> {
    if (this.configService.configData && this.configService.configData.codeSystemOrder &&
      this.configService.configData.codeSystemOrder.length > 0) {
      const order = this.configService.configData.codeSystemOrder;
      for (let i = order.length - 1; i >= 0; i--) {
        for (let j = 0; j <= codes.length; j++) {
          if (order[i] === codes[j]) {
            const a = codes.splice(j, 1);   // removes the item
            codes.unshift(a[0]);         // adds it back to the beginning
            break;
          }
        }
      }
    }
    return codes;
  }

  showAllRecords(): void {
    this.showExactMatches = false;
    this.processResponsiveness();
  }

}

interface DisplayFacet {
  type: string;
  bool: boolean;
  val: string;
}
