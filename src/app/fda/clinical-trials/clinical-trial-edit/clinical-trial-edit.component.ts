import { Component, OnInit, ViewChild} from '@angular/core';
import { ActivatedRoute, Router} from '@angular/router';
import { ClinicalTrialService } from '../clinical-trial/clinical-trial.service';
import { ClinicalTrial, BdnumNameAll } from '../clinical-trial/clinical-trial.model';
import { ClinicalTrialUSDrug } from '../clinical-trial/clinical-trial.model';
import { MiniSearchComponent } from '../mini-search/mini-search.component';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { ConfigService } from '@gsrs-core/config';
import * as _ from 'lodash';
import { LoadingService } from '@gsrs-core/loading';
import { MainNotificationService } from '@gsrs-core/main-notification';
import { AppNotification, NotificationType } from '@gsrs-core/main-notification';
import { MatTableModule } from '@angular/material/table';
import { MatTable } from '@angular/material/table';

import { FormsModule } from '@angular/forms';
import { MatTableDataSource } from '@angular/material';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {AuthService} from '@gsrs-core/auth/auth.service';
import { Pipe, PipeTransform } from '@angular/core';
import { tap, switchMap, map, concat, concatMap, delay, mergeMap } from 'rxjs/operators';
import { forkJoin } from 'rxjs';
import { Subscription } from 'rxjs';
import { Observable, throwError, of } from 'rxjs';
import { GeneralService } from '../../service/general.service';
import { L } from '@angular/cdk/keycodes';
import { MatMenuModule } from '@angular/material/menu';
  

// import { Auth } from '../../../core/auth/auth.model';


/**
 * @title Table with editing
 */

@Component({
  selector: 'app-clinical-trial-edit',
  templateUrl: './clinical-trial-edit.component.html',
  styleUrls: ['./clinical-trial-edit.component.scss']
})
export class ClinicalTrialEditComponent implements OnInit {
  clinicalTrial: ClinicalTrial;
  defaultSubstanceKeyType = 'UUID';
  agencySubstanceKeyType = 'UUID';

  isAdmin: boolean;
  isTesting  = true;
  displayedColumns: string[];
  dataSource = new MatTableDataSource([]);
  public  _trialNumber: string;
  bulkInputValue = '';
  // public facets: Array<Facet> = [];
  // private _facetParams: { [facetName: string]: { [facetValueLabel: string]: boolean } } = {};
  pageIndex: number;
  pageSize: number;
  totalClinicalTrials: number;
  isLoading = true;
  isError = false;
  model = {};
  miniSearchOutputReported = '';
  private subscriptions: Array<Subscription> = [];

  @ViewChild(MatTable, { static: false }) table: MatTable<any>;

  constructor(
    private activatedRoute: ActivatedRoute,
    private clinicalTrialService: ClinicalTrialService,
    private GeneralService: GeneralService,

    private sanitizer: DomSanitizer,
    public configService: ConfigService,
    private loadingService: LoadingService,
    private notificationService: MainNotificationService,
    private authService: AuthService,
    private router: Router
  ) {
  }

  ngOnInit() {
    this.authService.hasAnyRolesAsync('Admin', 'Updater', 'SuperUpdater').subscribe(response => {
      this.isAdmin = response;
      // testing
      // this.isAdmin = true;
      if (this.isAdmin) {
        this.displayedColumns = ['id', 'name', 'substanceKey', 'protectedMatch', 'orgSubstanceKey', 'link', 'delete'];
       } else {
         this.displayedColumns = ['name', 'substanceKey', 'protectedMatch', 'orgSubstanceKey', 'link'];
       }
    });
    this.pageSize = 10;
    this.pageIndex = 0;
    /*
    this.activatedRoute
      .queryParamMap
      .subscribe(params => {
        this._trialNumber = params.get('trialNumber') || '';
        this.getClinicalTrial();
      });
    */

        this.activatedRoute.paramMap.subscribe(params => {
        this._trialNumber = params.get('trialNumber');
    this.getClinicalTrial();

      });
  }

    ngAfterViewInit() {
  }  

  reportMiniSearchOutput(data) {
    this.clinicalTrialService.getSubstanceDetailsFromName(data.value).pipe(
      map(pageResult => pageResult['content'][0]),
      switchMap(substance => {
        return this.clinicalTrialService.getSubstanceDetailsFromSubstanceKey(substance['uuid']);
      })).subscribe(substance => {
         if (substance === null) {
          this.dataSource.data[data.myIndex].substanceKey = null;
          this.dataSource.data[data.myIndex].orgSubstanceKey = null;
        } else {
        this.dataSource.data[data.myIndex].name = data.value;
        if (substance !== undefined) {
          this.dataSource.data[data.myIndex].substanceKey = substance.uuid; 
          this.dataSource.data[data.myIndex].orgSubstanceKey = this.getOrgSubstanceKeyFromSubstance(substance); 
        } 
        }
    }, () => {
      this.dataSource.data[data.myIndex].substanceKey = null;
    });
    this.dataSource.data = this.dataSource.data;
  }

  reportMiniSearchOutput_OLD(data) {
   this.clinicalTrialService.getSubstanceDetailsFromName(data.value).subscribe(
    substanceDetails => {
      if (substanceDetails === null
          || substanceDetails.content === null
          || substanceDetails.content[0] === undefined
//          || substanceDetails.content[0].name===String('NULL')
//          || substanceDetails.content[0].name===String('null')
        ) {
        this.dataSource.data[data.myIndex].substanceKey = null;
        this.dataSource.data[data.myIndex].orgSubstanceKey = null;

        } else {
        this.dataSource.data[data.myIndex].name = data.value;
        if (substanceDetails.content[0] !== undefined) {
          this.dataSource.data[data.myIndex].substanceKey = substanceDetails.content[0].uuid; 
          // this.dataSource.data[data.myIndex].orgSubstanceKey = getOrgSubstanceKeyFromSubstanceCodes() 
        } 
        }
    }, () => {
      this.dataSource.data[data.myIndex].substanceKey = null;
    }
);
    this.dataSource.data = this.dataSource.data;
  }

  // need to work on this from config.
  addRow() {
    const model = { id: '', name: '', substanceKey: '', substanceKeyType: this.defaultSubstanceKeyType };
    this.dataSource.data.push(model);

    // why?
    this.dataSource.data = this.dataSource.data;
  }

  removeRow(i) {
    this.dataSource.data.splice(i, 1);
    this.dataSource.data = this.dataSource.data;
  }

  applyFilter(filterValue: string) {
    filterValue = filterValue.trim(); // Remove whitespace
    filterValue = filterValue.toLowerCase(); // MatTableDataSource defaults to lowercase matches
    this.dataSource.filter = filterValue;
  }

  // New
  getClinicalTrial() {
    this.loadingService.setLoading(true);
    this.dataSource.data = [];
    const trialObs = this.clinicalTrialService.getClinicalTrial(this._trialNumber);
    const substanceObs: Array<Observable<any>> = [];
    const trialObs$ = forkJoin(trialObs).pipe(
      map(_data => {
        const data = _data[0];
        this.isError = false;
        if (data.clinicalTrialUSDrug !== null) {
          data.clinicalTrialUSDrug.forEach(element => {
            this.dataSource.data.push({
              id: element.id,
              substanceKey: element.substanceKey,
              substanceKeyType: element.substanceKeyType,
              name: '',
              protectedMatch: element.protectedMatch
            });
            substanceObs.push(this.clinicalTrialService.getSubstanceDetailsFromSubstanceKey(element.substanceKey));
          });
        }
        this.clinicalTrial = data;
        return substanceObs;
      }),
      mergeMap((substanceObs) => forkJoin(substanceObs).pipe(
        map(substances => {
          const complements = {};
          substances.forEach(substance => {
            complements[substance.uuid] = {
              'substanceKey': substance.uuid,
              'orgSubstanceKey': this.getOrgSubstanceKeyFromSubstance(substance),
              'name': substance._name,
            };
          });
          this.dataSource.data.forEach((element) => {
            if (complements[element.substanceKey]) {
              element.name = complements[element.substanceKey].name;
              element.orgSubstanceKey = complements[element.substanceKey].orgSubstanceKey;
              console.log('element.orgSubstanceKey: ' + element.orgSubstanceKey);  
            }
          });
          // don't know why but deep clone makes the myInitialSearch value work as expected perhaps by rerending table. 
          const data = _.cloneDeep(this.dataSource.data);
          // but this doesn't work. 
          // const data = [...this.dataSource.data];
          this.dataSource.data = data; 
        })
      )
      )
      );
    const subscription = trialObs$.subscribe(() => {
      // this.table.renderRows();
      // console.log('table:');
      // console.log("table:", this.table);
      }, () => {
        const notification: AppNotification = {
          message: 'There was an error trying to retrieve clinical trial. Please refresh and try again.',
          type: NotificationType.error,
          milisecondsToShow: 6000
        };
        this.isError = true;
        this.isLoading = false;
        this.loadingService.setLoading(this.isLoading);
        this.notificationService.setNotification(notification);
      }, () => {
        this.isLoading = false;
        this.loadingService.setLoading(this.isLoading);
    });
    this.subscriptions.push(subscription);
  }

    getOrgSubstanceKeyFromSubstance(substance) {
      let code = null; 
      if (substance.codes &&  substance.codes !== null && substance.codes.length > 0) {
        for (const element of substance.codes) {
          if (element.codeSystem && element.codeSystem === 'BDNUM') {
            if (element.type && element.type === 'PRIMARY') {
              console.log('bdnum: ' + element.code);
              code = element.code;
              break;
            }
          }
        }
      }
      return code;
    }

    // OLD2
    getClinicalTrialOLD2() {
    this.loadingService.setLoading(true);
    this.dataSource.data = [];
    console.log('XXXX ab' + this._trialNumber);

    const trialSubscription = this.clinicalTrialService.getClinicalTrial(this._trialNumber)
      .subscribe(data => {
        this.isError = false;
        console.log('XXXX ac' + data);
        if (data.clinicalTrialUSDrug !== null) {
          const _observables: Array<Observable<any>> = [];
          data.clinicalTrialUSDrug.forEach(element => {
          this.dataSource.data.push({
              id: element.id,
              substanceKey: element.substanceKey,
              substanceKeyType: element.substanceKeyType,
              name: null,
              protectedMatch: element.protectedMatch
           });
            _observables.push(this.clinicalTrialService.getSubstanceDetailsFromSubstanceKey(element.substanceKey));
          });
          const substanceSubscriptions = forkJoin(_observables).subscribe({
            next: substances => {
              const complements = {};
              substances.forEach(substance => {
                complements[substance.uuid] = { 'substanceKey': substance.uuid, 'name': substance._name };
              });
              console.log('complements: ');
              console.log(complements);


              this.dataSource.data.forEach(element => {
                // if (complements[element.substanceKey]) {
                  console.log('sk: ');
                console.log(element.substanceKey);
                  console.log('name: ');
                  console.log(complements[element.substanceKey].name);

                  element.name = complements[element.substanceKey].name;
                // }
              });
            },
            complete: () => console.log('This is how it ends!')
          });
          // this.subscriptions.push(substanceSubscriptions);


          // Weird, why is this necessary?substanceName
          this.clinicalTrial = data;
          this.dataSource.data = this.dataSource.data;
          console.log('this.dataSource.data');
          console.log(this.dataSource.data);
        }

      }, () => {
        const notification: AppNotification = {
          message: 'There was an error trying to retrieve clinical trial. Please refresh and try again.',
          type: NotificationType.error,
          milisecondsToShow: 6000
        };
        this.isError = true;
        this.isLoading = false;
        this.loadingService.setLoading(this.isLoading);
        this.notificationService.setNotification(notification);
      }, () => {
        this.isLoading = false;
        this.loadingService.setLoading(this.isLoading);
      });
  }

  // OLD1
  getClinicalTrialOLD1() {
    this.loadingService.setLoading(true);
    this.dataSource.data = [];
    console.log('XXXX ab' + this._trialNumber);

    const trialSubscription = this.clinicalTrialService.getClinicalTrial(this._trialNumber)
      .subscribe(data => {
        this.isError = false;
        console.log('XXXX ac' + data);
        if (data.clinicalTrialUSDrug !== null) {

          data.clinicalTrialUSDrug.forEach(element => {
            let substanceName = null;
            const subscription = this.clinicalTrialService.getSubstanceDetailsFromSubstanceKey(element.substanceKey).subscribe(substance => {
              substanceName = substance._name;
              console.log('substanceName: ' + substanceName);
            });
            // this.subscriptions.push(subscription);

            this.dataSource.data.push({
              id: element.id,
              substanceKey: element.substanceKey,
              substanceKeyType: element.substanceKeyType,
              name: substanceName,
              protectedMatch: element.protectedMatch
            });
          });
          // this.subscriptions.push(trialSubscription);

          // Weird, why is this necessary?substanceName
          this.clinicalTrial = data;
          this.dataSource.data = this.dataSource.data;
          console.log('this.dataSource.data');
          console.log(this.dataSource.data);
        }

      }, () => {
        const notification: AppNotification = {
          message: 'There was an error trying to retrieve clinical trial. Please refresh and try again.',
          type: NotificationType.error,
          milisecondsToShow: 6000
        };
        this.isError = true;
        this.isLoading = false;
        this.loadingService.setLoading(this.isLoading);
        this.notificationService.setNotification(notification);
      }, () => {
        this.isLoading = false;
        this.loadingService.setLoading(this.isLoading);
      });
  }









  updateClinicalTrial() {
    // var that = this;
    this.loadingService.setLoading(true);
    const newClinicalTrial = _.cloneDeep(this.clinicalTrial);
    const newClinicalTrialUSDrugs: Array<ClinicalTrialUSDrug> = [];
    this.dataSource.data.forEach((element)  => {
      const ctd = {} as ClinicalTrialUSDrug;
      ctd.id = element.id;
      ctd.trialNumber = element.trialNumber;
      ctd.substanceKey = element.substanceKey;
      ctd.substanceKeyType = element.substanceKeyType;
      ctd.protectedMatch = element.protectedMatch;
      newClinicalTrialUSDrugs.push(ctd);
    });
    newClinicalTrial.clinicalTrialUSDrug = newClinicalTrialUSDrugs;
    this.clinicalTrialService.updateClinicalTrial(
      newClinicalTrial
    )
      .subscribe( data => {
        this.getClinicalTrial();
        // the code below in the if (0) { ... } used to work by relying on the data reponse
        // from the PUT, but for some reason, now, data from prior to the update would
        // sneak back into the edit component. Thefore, for now, I am reloading
        // the data with the GET after a successful update.
        if (0) {
        this.isError = false;
        this.dataSource.data = [];
        data.clinicalTrialUSDrug.forEach(element => {
          this.dataSource.data.push(
            {
              id: element.id,
              substanceKey: element.substanceKey,
              name: element.substanceDisplayName,
              protectedMatch: element.protectedMatch
            }
          );
          // Weird, why is this necessary?
          this.clinicalTrial = data;
          this.dataSource.data = this.dataSource.data;
        });
        }

        const message = 'Success';
        const notification: AppNotification = {
          message: message,
          type: NotificationType.success,
          milisecondsToShow: 6000
        };
        this.isError = false;
        this.isLoading = false;
        this.loadingService.setLoading(this.isLoading);
        this.notificationService.setNotification(notification);
      }, error => {
        let message = 'There was an error trying to update clinical trial.';
          if (error.error.errors !== undefined && error.error.errors !== null) {
         error.error.errors.forEach(element => {
           if (element) {
             message = message + ' ' + element;
           }
         });
          }
          if (error.error.validationMessages !== undefined  && error.error.validationMessages !== null) {
          error.error.validationMessages.forEach(element => {
            if (element.message !== null) {
              message = message + ' ' + element.message;
            }
         });
        }
        const notification: AppNotification = {
          message: message,
          type: NotificationType.error,
          milisecondsToShow: 6000
        };
        this.isError = true;
        this.isLoading = false;
        this.loadingService.setLoading(this.isLoading);
        this.notificationService.setNotification(notification);
      }, () => {
        this.isLoading = false;
        this.loadingService.setLoading(this.isLoading);
      }).add(() => {
        console.log('Inside empty add method.');
      });
  }

    copyInputMessage(inputElement) {
    inputElement.select();
    document.execCommand('copy');
//    inputElement.setSelectionRange(0, 0);
//    this.textMessageFunc('Text');
  }

  substancesToClipboard1a() {
      const textArray = [];
      this.dataSource.data.forEach(element => {
        textArray.push(element.substanceKey);
      });
      this.copyTextAreaToClipBoard(textArray.join('\n'));
    }
    substancesToClipboard1b() {
      const textArray = [];
      this.dataSource.data.forEach(element => {
        textArray.push(element.substanceKey);
      });
      this.copyTextAreaToClipBoard(textArray.join('; '));
    }


    substancesToClipboard2a() {
      const textArray = [];
      this.dataSource.data.forEach(element => {
        textArray.push(element.name + '\t' + element.substanceKey);
      });
      this.copyTextAreaToClipBoard(textArray.join('\n'));
    }

    substancesToClipboard2b() {
      const textArray1 = [];
      const textArray2 = [];
      this.dataSource.data.forEach(element => {
        textArray1.push(element.name);
        textArray2.push(element.substanceKey);
      });
      this.copyTextAreaToClipBoard(textArray1.join('; ') + '\t' + textArray2.join('; '));
    }

    substancesToClipboard3a() {
      const textArray = [];
      this.dataSource.data.forEach(element => {
        textArray.push(this._trialNumber + '\t' + element.name + '\t' + element.substanceKey);
      });
      this.copyTextAreaToClipBoard(textArray.join('\n'));
    }

    substancesToClipboard3b() {
      const textArray1 = [];
      const textArray2 = [];
      this.dataSource.data.forEach(element => {
        textArray1.push(element.name);
        textArray2.push(element.substanceKey);
      });
      this.copyTextAreaToClipBoard(this._trialNumber + '\t' + textArray1.join('; ') + '\t' + textArray2.join('; '));
    }


    copyTextAreaToClipBoard(message: string) {
      const cleanText = message.replace(/<\/?[^>]+(>|$)/g, '');
      const x = document.createElement('TEXTAREA') as HTMLTextAreaElement;
      x.value = cleanText;
      document.body.appendChild(x);
      x.select();
      document.execCommand('copy');
      document.body.removeChild(x);
  }

  ngOnDestroy() {
    this.subscriptions.forEach(subscription => {
      if (subscription) {
        subscription.unsubscribe();
      }
    });
    // this.facetManagerService.unregisterFacetSearchHandler();
  }


} // end class
