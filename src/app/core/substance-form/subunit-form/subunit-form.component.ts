import {
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges
} from '@angular/core';
import {Feature, SubstanceName, SubstanceReference, Subunit} from '@gsrs-core/substance';
import {ControlledVocabularyService, VocabularyTerm} from '@gsrs-core/controlled-vocabulary';
import {UtilsService} from '@gsrs-core/utils';
import {SubstanceFormService} from '@gsrs-core/substance-form/substance-form.service';
import {Subject, Subscription} from 'rxjs';
import {ScrollToService} from '@gsrs-core/scroll-to/scroll-to.service';
import {GoogleAnalyticsService} from '@gsrs-core/google-analytics';
import {SubunitDisplayPipe} from '@gsrs-core/utils/subunit-display.pipe';
import {CdkTextareaAutosize} from '@angular/cdk/text-field';
@Component({
  selector: 'app-subunit-form',
  templateUrl: './subunit-form.component.html',
  styleUrls: ['./subunit-form.component.scss']
})

export class SubunitFormComponent implements OnInit, OnDestroy, OnChanges, AfterViewInit {
  @Input() subunit: Subunit;
  @Input() view: string;
  @Input() sites?: Array<any>;
  @Output() subunitDeleted = new EventEmitter<Subunit>();
  privateAllSites: Array<DisplaySite>;
 // @Input() hideDelete = false;
  subunitSequence: SubunitSequence;
  vocabulary: { [vocabularyTermValue: string]: VocabularyTerm } = {};
  //view = 'details';
  private subscriptions: Array<Subscription> = [];
  toggle = {};
  allSites: Array<DisplaySite> = [];
  features: Array<any> = [];


  constructor(
    private substanceFormService: SubstanceFormService,
    private scrollToService: ScrollToService,
    public gaService: GoogleAnalyticsService,
    private cvService: ControlledVocabularyService,
  ) {

  }

 /* @Input()
  set allSites(sites: Array<DisplaySite>) {
    console.log(sites);
    if (sites != null) {
      this.privateAllSites = sites;
     // this.addStyle();
      console.log(sites);
    }
  }

  get allSites(): Array<DisplaySite> {
    return this.privateAllSites || [];
  }*/


  ngOnInit() {
    this.getVocabularies();
  }

  ngAfterViewInit() {

    const disulfideLinksSubscription = this.substanceFormService.substanceDisulfideLinks.subscribe(disulfideLinks => {
      console.log('triggered in subunit card');
      console.log(disulfideLinks);
      disulfideLinks.forEach(link => {
        if(link.sites){
          link.sites.forEach(site => {
            if(site.subunitIndex === this.subunit.subunitIndex) {
              const newLink: DisplaySite = {residue: site.residueIndex, subunit: site.subunitIndex, type: 'disulfide'};
              this.allSites.push(newLink);
            }
          });
        }
      });
    });
    this.subscriptions.push(disulfideLinksSubscription);

    const otherLinksSubscription = this.substanceFormService.substanceOtherLinks.subscribe(otherLinks => {
      otherLinks.forEach(link => {
        if (link.sites) {
          link.sites.forEach(site => {
            if(site.subunitIndex === this.subunit.subunitIndex) {
              const newLink: DisplaySite = {residue: site.residueIndex, subunit: site.subunitIndex, type: 'other'};
              this.allSites.push(newLink);
              console.log('SFC OL changes');
            }
          });
        }
      });
    });
    this.subscriptions.push(otherLinksSubscription);

    const glycosylationSubscription = this.substanceFormService.substanceGlycosylation.subscribe(glycosylation => {


      if (glycosylation.CGlycosylationSites) {

        glycosylation.CGlycosylationSites.forEach(site => {
          // this.CGlycosylationSites.push(site);
          if(site.subunitIndex === this.subunit.subunitIndex) {
            const newLink: DisplaySite = {residue: site.residueIndex, subunit: site.subunitIndex, type: 'Cglycosylation'};
            console.log('SFC c changes');
            console.log(site);
            this.allSites.push(newLink);
          }
        });
      }

      if (glycosylation.NGlycosylationSites) {
        glycosylation.NGlycosylationSites.forEach(site => {
          //    this.NGlycosylationSites.push(site);
          if(site.subunitIndex === this.subunit.subunitIndex) {
            const newLink: DisplaySite = {residue: site.residueIndex, subunit: site.subunitIndex, type: 'Nglycosylation'};
            this.allSites.push(newLink);
          }
        });
      }

      if (glycosylation.OGlycosylationSites) {
        glycosylation.OGlycosylationSites.forEach(site => {
          //this.OGlycosylationSites.push(site);
          if(site.subunitIndex === this.subunit.subunitIndex) {
            const newLink: DisplaySite = {residue: site.residueIndex, subunit: site.subunitIndex, type: 'Oglycosylation'};
            this.allSites.push(newLink);
          }

        });
      }
      const propertiesSubscription = this.substanceFormService.substanceProperties.subscribe( properties => {
        properties.forEach(prop => {
          if (prop.propertyType === 'PROTEIN FEATURE') {
            const featArr = prop.value.nonNumericValue.split(';');
            featArr.forEach(f => {
              if (Number(f.split('_')[0]) === this.subunit.subunitIndex) {
                const sites = f.split('-');
                for (let i = Number(sites[0].split('_')[1]); i <= Number(sites[1].split('_')[1]); i++ ) {
                  const newLink: DisplaySite = {residue: Number(i), subunit: this.subunit.subunitIndex, type: 'feature' };
                  this.allSites.push(newLink);
                }
              }
            });
          }
        });
      });

      this.subscriptions.push(propertiesSubscription);
    console.log(this.allSites);
      setTimeout(() => {
       if (this.subunitSequence){
          console.log('adding style afterviewinit');
         this.addStyle();
       }
      });
    });
  }

    ngOnChanges(changes: SimpleChanges) {
    }

  ngOnDestroy() {
    this.subscriptions.forEach(subscription => {
      subscription.unsubscribe();
    });
  }

  getVocabularies(): void {
    this.cvService.getDomainVocabulary('AMINO_ACID_RESIDUE').subscribe(response => {
      this.vocabulary = response['AMINO_ACID_RESIDUE'].dictionary;
      this.processSubunits();
    }, error => {
      this.processSubunits();
    });
  }

  addStyle(): void {
    console.log('about to add style');
    console.log(this.allSites);
    console.log(this.subunitSequence);
    console.log(this.features);
    if (this.subunitSequence && this.subunitSequence.subunits) {
      this.allSites.forEach(site => {
        if (this.subunitSequence.subunits) {
          this.subunitSequence.subunits[site.residue - 1].class = site.type;
        } else {
        }
      });
      /*if (this.features) {
        this.features.forEach(feat => {
          this.drawFeature(feat);
        });
      }*/
    }

  }

  private processSubunits(): void {
    const subunitIndex = this.subunit.subunitIndex;
    this.subunit.sequence = this.subunit.sequence.trim().replace(/\s/g, '');
    const sequence = this.subunit.sequence.trim().replace(/\s/g, '');

    if (this.subunit.length !== this.subunit.sequence.length) {
      this.subunit.length = this.subunit.sequence.length;
    }
    const subunit = this.subunit.sequence.trim().replace(/\s/g, '');
      const subsections = [];
      let currentSections = [];
      for (let count = 0; count < subunit.length; count = count + 10) {
        if ((count + 10) >= subunit.length) {
          currentSections.push([count, subunit.length]);
          subsections.push(currentSections);
        } else {
          currentSections.push([count, count + 10]);
        }
        if ((count + 10) % 50 === 0) {
          subsections.push(currentSections);
          currentSections = [];
        }
      }
      const thisTest: SubunitSequence =  {
        subunitIndex: subunitIndex,
        subunits: [],
        subsections: subsections,
        subgroups: currentSections
      };
      let index = 0;
      const indexEnd = subunit.length;
      while (index <= indexEnd) {
        if (subunit[index]) {
          const sequenceUnit: SequenceUnit = {
            unitIndex: index + 1,
            unitValue: subunit[index],
            class: ''
          };
          thisTest.subunits.push(sequenceUnit);
        }
        index++;
      }
      this.subunitSequence = thisTest;

    setTimeout(() => {console.log('after sequencegen style'); this.addStyle(); });

  }

  getTooltipMessage(subunitIndex: number, unitIndex: number, unitValue: string): string {
    const vocab = (this.vocabulary[unitValue.toUpperCase()] === undefined ? 'UNDEFINED' : this.vocabulary[unitValue.toUpperCase()].display);
    return `${subunitIndex} - ${unitIndex}: ${unitValue.toUpperCase()} (${vocab})`;
  }

  private editSubunit(subunit: Subunit, input: string): void {
    //  this.substanceFormService.addSubstanceSubunit();
    // this.substanceFormService.assSubstanceSubunit();
    this.toggle[subunit.subunitIndex] = !this.toggle[subunit.subunitIndex];
    if (this.toggle[subunit.subunitIndex] === false) {
      this.subunit.sequence = input.trim().replace(/\s/g, '');;
      console.log(input);
      this.substanceFormService.emitSubunitUpdate();
      this.substanceFormService.recalculateCysteine();
      this.processSubunits();
      console.log('saved');
    } else {
      setTimeout(function () {
        const textArea = document.getElementsByClassName("sequence-textarea");
        [].forEach.call(textArea, function (area){
           console.log(area.scrollHeight);
           console.log(area.style.height);
           area.style.height = (area.scrollHeight + 10) + 'px';
      });

      });
    }
  }
  addStyle2(): void {
    if (this.subunitSequence) {
      this.allSites.forEach(site => {
          this.subunitSequence.subunits[site.residue - 1].class = site.type;
        });
    }
  }

  deleteSubunit(subunit: Subunit): void {
    this.substanceFormService.deleteSubstanceSubunit(subunit);
  }

  cleanSequence(): void{
    const valid = [];
    const test = this.subunit.sequence.split('');
    for (const key in this.vocabulary) {
      valid.push(this.vocabulary[key].value);
    }
    this.subunit.sequence =  test.filter(char => valid.indexOf(char.toUpperCase()) >= 0).toString().replace(/,/g, '').trim();

  }


}
interface SubunitSequence {
  subunitIndex?: number;
  subsections?: Array<any>;
  subgroups?: Array<any>;
  subunits?: Array<SequenceUnit>;
}

interface SequenceUnit {
  unitIndex: number;
  unitValue: string;
  class: string;
}

interface DisplaySite {
  type: string;
  subunit: number;
  residue: number;
}
