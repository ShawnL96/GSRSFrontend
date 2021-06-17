import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { ConfigService } from '@gsrs-core/config';
import { BaseHttpService } from '@gsrs-core/base';
import { ClinicalTrial } from './clinical-trial.model';
import { BdnumNameAll } from './clinical-trial.model';
import { PagingResponse } from '@gsrs-core/utils';
import { map, switchMap, tap } from 'rxjs/operators';
import { ClinicalTrialFacetParam } from '../misc/clinical-trial-facet-param.model';
import {Facet, FacetQueryResponse, FacetHttpParams} from '@gsrs-core/facets-manager';

@Injectable()
export class ClinicalTrialService extends BaseHttpService {

  totalRecords: 0;
  ncatsApiBaseUrl = 'https://gsrs.ncats.nih.gov/ginas/app/api/v1/';

  constructor(
    public http: HttpClient,
    public configService: ConfigService
  ) {
    super(configService);
  }

  getClinicalTrials(args: {
    searchTerm?: string,
    cutoff?: number,
    type?: string,
    pageSize?: number,
    order?: string,
    facets?: ClinicalTrialFacetParam,
    skip?: number
  } = {}): Observable<PagingResponse<ClinicalTrial>> {
    return new Observable(observer => {
      console.log('XXXX 1');
      this.searchClinicalTrials(
          args.searchTerm,
          args.pageSize,
          args.facets,
          args.order,
          args.skip,
          args.type
        ).subscribe(response => {
          observer.next(response);
        }, error => {
          observer.error(error);
        }, () => {
          observer.complete();
        });
    });
  }

  searchClinicalTrials(
    searchTerm?: string,
    pageSize: number = 10,
    facets?: ClinicalTrialFacetParam,
    order?: string,
    skip: number = 0,
    type?: string
  ): Observable<PagingResponse<ClinicalTrial>> {

    let params = new FacetHttpParams();
    let url = this.apiBaseUrl;
    url += 'clinicaltrial/search';
    if (!searchTerm) { searchTerm = ''; }
    if (searchTerm !== null && searchTerm !== '') {
      if (type !== null && type !== '') {
        if (type === 'trialNumber' ) {
          // not working yet
          params = params.append('q', 'root_ctId:\"^' + searchTerm + '$\"');
        } else if (type === 'substanceKey' ) {
          // not working yet
          params = params.append('q', 'root_clinicalTrialDrug_substanceKey:\"^' + searchTerm + '$\"');
        } else if (type === 'title') {
          params = params.append('q', 'root_title:\"' + searchTerm + '\"');
        } else {
          params = params.append('q', searchTerm);
        }
      } else {
        params = params.append('q', searchTerm);
      }
    }
    params = params.appendFacetParams(facets);

    params = params.appendDictionary({
      top: pageSize && pageSize.toString(),
      skip: skip && skip.toString()
    });

    if (order !== null && order !== '') {
      params = params.append('order', order);
    }
    params = params.append('fdim', '10');

    const options = {
      params: params
    };
    return this.http.get<PagingResponse<ClinicalTrial>>(url, options);
  }

  deleteClinicalTrial(id: string): Observable<any> {
    const url = `${this.apiBaseUrl}clinicaltrial(${id})`;
    const params = new HttpParams();
    // params = params.append('view', 'full');
    const options = {
      params: params
    };
    const x = this.http.delete<ClinicalTrial>(url, options);
    return x;
  }

  getClinicalTrial(id: string): Observable<ClinicalTrial> {
    const url = this.apiBaseUrl + `clinicaltrial(${id})`;
    const params = new HttpParams();
    // params = params.append('view', 'full');
    const options = {
      params: params
    };
    const x = this.http.get<ClinicalTrial>(url, options);
    return x;
  }

  getSubstanceDetailsFromName(name: string): Observable<any> {

    // __alex__ original
    // const url = this.apiBaseUrl + 'substances/search?q=root_names_name:"^'
    //  + encodeURIComponent(name) + '$"&fdim=1';
    // __alex__ temporary
    // const url = this.apiBaseUrl
    // + 'api/v1/clinicaltrial/@substancenamepassthru/search?name='
    // + encodeURIComponent(name);
    // __alex__ ncats

    const url = this.ncatsApiBaseUrl + 'substances/search?q=root_names_name:"^'
     + encodeURIComponent(name) + '$"&fdim=1';


    const params = new HttpParams();
    // params = params.append('view', 'full');
    const options = {
      params: params
    };
    // let headers: HttpHeaders = new HttpHeaders();
    // headers = headers.append('Accept', 'application/json');
    const x = this.http.get<any>(url);
    return x;
  }

  getSubstanceDetailsFromSubstanceKey(substanceKey: string): Observable<any> {
    // __alex__ original
    // const url = this.apiBaseUrl + 'substances(' + encodeURIComponent(substanceKey) + ')';

    // __alex__ temporary
    // const url = this.apiBaseUrl
    // + 'api/v1/clinicaltrial/@substancepassthru/'
    // + encodeURIComponent(substanceKey);

    //  __alex__ ncats
    const url = this.ncatsApiBaseUrl + 'substances(' + encodeURIComponent(substanceKey) + ')';

    const params = new HttpParams();
    // params = params.append('view', 'full');
    const options = {
      params: params
    };
    const x = this.http.get<any>(url);
    return x;
  }

  addClinicalTrial(body): Observable<ClinicalTrial> {
    const url = this.apiBaseUrl + `clinicaltrial`;
    const params = new HttpParams();
    const options = {
      params: params,
      type: 'JSON',
      headers: {
        'Content-type': 'application/json'
      }
    };
    const x = this.http.post<ClinicalTrial>(url, body, options);
    return x;
  }

  updateClinicalTrial(body): Observable<ClinicalTrial> {
    const url = this.apiBaseUrl + `clinicaltrial`;
    const params = new HttpParams();
    // params = params.append('view', 'full');
    const options = {
      params: params,
      headers: {
        'Content-type': 'application/json'
      }

    };
    // this is actually geting the data from the PUT, but that gets lost in the subscribe routine.
    // letting the prevous data remain; very annoying. Could this have something to do with const declarations?
    const x = this.http.put<ClinicalTrial>(url, body, options);
    return x;
  }

  getSubstanceClinicalTrials(
    bdnum: string, page: number, pageSize: number
  ): Observable<Array<any>> {
    const url = this.baseUrl + 'clinicalTrialListByBdnum?bdnum=' + bdnum + '&page=' + (page + 1) + '&pageSize=' + pageSize;

    return this.http.get<Array<any>>(url).pipe(
      map(results => {
        this.totalRecords = results['totalRecords'];
        return results['data'];
      })
    );
  }

  getSubstanceClinicalTrialsEurope(
    bdnum: string, page: number, pageSize: number
  ): Observable<Array<any>> {
    const url = this.baseUrl + 'clinicalTrialEuropeListByBdnum?bdnum=' + bdnum + '&page=' + (page + 1) + '&pageSize=' + pageSize;

    return this.http.get<Array<any>>(url).pipe(
      map(results => {
        this.totalRecords = results['totalRecords'];
        return results['data'];
      })
    );
  }

  getClinicalTrialDetails(
    trialNumber: string, src: string
  ): Observable<any> {
    const url = this.baseUrl + 'clinicalTrialDetails2?trialNumber=' + trialNumber + '&src=' + src;

    return this.http.get<any>(url).pipe(
      map(results => {
        return results;
      })
    );
  }

  getClinicalTrialsFacets(facet: Facet, searchTerm?: string, nextUrl?: string): Observable<FacetQueryResponse> {
    let url: string;
    if (searchTerm) {
      url = `${this.configService.configData.apiBaseUrl}api/v1/clinicaltrial/search/@facets?wait=false&kind=ix.ct.models.ClinicalTrial&skip=0&fdim=200&sideway=true&field=${facet.name.replace(' ', '+')}&top=14448&fskip=0&fetch=100&order=%24lastUpdated&ffilter=${searchTerm}`;
    } else if (nextUrl != null) {
      url = nextUrl;
    } else {
      url = facet._self;
    }
    return this.http.get<FacetQueryResponse>(url);
  }

  // see substance.service
  filterFacets(name: string, category: string ): Observable<any> {
    console.log('I am in the service, filter facets');
    const url =  `${this.configService.configData.apiBaseUrl}api/v1/clinicaltrial/search/@facets?wait=false&kind=ix.ct.models.ClinicalTrial&skip=0&fdim=200&sideway=true&field=${category}&top=14448&fskip=0&fetch=100&order=%24lastUpdated&ffilter=${name}`;
    return this.http.get(url);
  }
// see substance.service
  retrieveFacetValues(facet: Facet): Observable<any> {
    const url = facet._self;
    return this.http.get<any>(url);
  }
// see substance.service
  retrieveNextFacetValues(facet: Facet): Observable<any> {
    const url = facet._self;
    if (!facet.$next) {
      return this.http.get<any>(url).pipe(
        switchMap(response => {
          if (response) {
            const next = response.nextPageUri;
            return this.http.get<any>(next);
          } else {
            return 'nada';
          }
        }));
    } else {
      return this.http.get<any>(facet.$next);
    }

  }
  getClinicalTrialListExportUrl(bdnum: string): string {
    return this.baseUrl + 'clinicalTrialListExport?bdnum=' + bdnum;
  }

  getClinicalTrialEuropeListExportUrl(bdnum: string): string {
    return this.baseUrl + 'clinicalTrialEuropeListExport?bdnum=' + bdnum;
  }

  getUpdateApplicationUrl(): string {
    return this.baseUrl + 'updateApplication?applicationId=';
  }


}
