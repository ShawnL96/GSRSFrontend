import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { ConfigService } from '@gsrs-core/config';
import { BaseHttpService } from '@gsrs-core/base';
import { PagingResponse } from '@gsrs-core/utils';
// import { ApplicationSrs } from '../model/application.model';
import { SubstanceFacetParam } from '../../../core/substance/substance-facet-param.model';
import { SubstanceHttpParams } from '../../../core/substance/substance-http-params';
import { map } from 'rxjs/operators';

@Injectable(
  {
    providedIn: 'root',
  }
)

export class AdverseEventService extends BaseHttpService {

  constructor(
    public http: HttpClient,
    public configService: ConfigService
  ) {
    super(configService);
  }

  /*
  getApplications(
    skip: number = 0,
    pageSize: number = 10,
    searchTerm?: string,
    facets?: SubstanceFacetParam
  ): Observable<PagingResponse<ApplicationSrs>> {
    let params = new SubstanceHttpParams();
    params = params.append('skip', skip.toString());
    params = params.append('top', pageSize.toString());
    if (searchTerm !== null && searchTerm !== '') {
      params = params.append('q', searchTerm);
    }

    params = params.appendFacetParams(facets);

    const url = `${this.apiBaseUrl}applicationssrs/search`;
    const options = {
      params: params
    };
    return this.http.get<PagingResponse<ApplicationSrs>>(url, options);
  }
*/

  getSubstanceAdverseEventPt(
    substanceId: string
  ): Observable<Array<any>> {
    const url = 'http://localhost:9000/ginas/app/adverseEventPtListByBdnum?bdnum=0011303AA';

    return this.http.get<Array<any>>(url).pipe(
      map(adverseevent => {
        console.log("Adverse Event PT Length: " + adverseevent.length);
       return adverseevent;
      })
    );
  }


  getSubstanceAdverseEventDme(
    substanceId: string
  ): Observable<Array<any>> {
    const url = 'http://localhost:9000/ginas/app/adverseEventDmeListByBdnum?bdnum=0011303AA';

    return this.http.get<Array<any>>(url).pipe(
      map(adverseevent => {
        console.log("Adverse Event PT Length: " + adverseevent.length);
       return adverseevent;
      })
    );

  }

  getSubstanceAdverseEventCvm(
    substanceId: string
  ): Observable<Array<any>> {
    const url = 'http://localhost:9000/ginas/app/adverseEventCvmListByBdnum?bdnum=0011303AA';

    return this.http.get<Array<any>>(url).pipe(
      map(adverseevent => {
        console.log("Adverse Event PT Length: " + adverseevent.length);
       return adverseevent;
      })
    );

  }




} //class
