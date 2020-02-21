import { Component, OnInit, AfterViewInit } from '@angular/core';
import { SubstanceFormBase } from '../substance-form-base';
import { ControlledVocabularyService } from '../../controlled-vocabulary/controlled-vocabulary.service';
import { VocabularyTerm } from '../../controlled-vocabulary/vocabulary.model';
import { FormControl } from '@angular/forms';
import { MatSelectChange } from '@angular/material/select';
import { SubstanceService } from '../../substance/substance.service';
import { SubstanceSummary, SubstanceRelationship } from '../../substance/substance.model';
import { SubstanceFormService } from '../substance-form.service';
import { SubstanceFormDefinition } from '../substance-form.model';
import {Router} from '@angular/router';
import {AuthService} from '@gsrs-core/auth';

@Component({
  selector: 'app-substance-form-definition',
  templateUrl: './substance-form-definition.component.html',
  styleUrls: ['./substance-form-definition.component.scss']
})
export class SubstanceFormDefinitionComponent extends SubstanceFormBase implements OnInit, AfterViewInit {
  definitionTypes: Array<VocabularyTerm>;
  definitionLevels: Array<VocabularyTerm>;
  primarySubstance?: SubstanceSummary;
  definition: SubstanceFormDefinition;
  primarySubUuid: string;
  uuid: string;
  json: any;
  feature: string;
  substanceClass: string;
  isAdmin: boolean;
  status: string;
  classes = ['protein',
  'chemical',
  'structurallyDiverse',
  'polymer',
  'nucleicAcid',
  'mixture',
  'specifiedSubstanceG1'];

  constructor(
    private cvService: ControlledVocabularyService,
    public substanceService: SubstanceService,
    private substanceFormService: SubstanceFormService,
    private router: Router,
    private authService: AuthService

  ) {
    super();
  }

  ngOnInit() {
    this.menuLabelUpdate.emit('Definition');
    this.getVocabularies();
    this.isAdmin = this.authService.hasRoles('admin');
  }

  useFeature(feature: any): void {
    this.feature = feature.value;
    if (this.feature === 'glyco') {
      this.glyco();
    } else if (this.feature === 'disulfide') {
      this.disulfide();
    }if (this.feature === 'concept') {
      this.concept();
    } if (this.feature === 'unapprove') {
      if (confirm('Are you sure you\'d like to remove the approvalID?')) {
        this.substanceFormService.unapproveRecord();
      }
      this.feature = undefined;
    }
  }

  changeClass(type: any): void {
    this.router.navigate(['/substances', this.uuid, 'edit'], { queryParams: { switch: type.value } });
    this.feature = undefined;
  }

  setPrivate(): void {
    this.substanceFormService.setDefinitionPrivate();
    this.feature = undefined;
  }

  setPublic(): void {
    this.substanceFormService.setDefinitionPublic();
    this.feature = undefined;
  }

  changeStatus(status: any): void {
    this.substanceFormService.changeStatus(status.value);
    this.feature = undefined;
  }

  concept(): void {
    this.substanceFormService.conceptNonApproved();
    this.feature = undefined;
  }

  glyco(): void {
    this.substanceFormService.predictSites();
    this.feature = undefined;
  }

  disulfide(): void {
    this.substanceFormService.disulfideLinks();
    this.feature = undefined;
  }

  ngAfterViewInit() {
    this.substanceFormService.definition.subscribe(definition => {
      this.definition = definition || {};
      if (this.definition.substanceClass === 'structure') {
        this.substanceClass = 'chemical';
      } else if (this.definition.substanceClass === 'nucleicAcid') {
        this.substanceClass = 'Nucleic Acid';
      } else if (this.definition.substanceClass === 'structurallyDiverse') {
        this.substanceClass = 'Structurally Diverse';
      } else {
        this.substanceClass = this.definition.substanceClass;
      }
      if (!this.definition.definitionType) {
        this.definition.definitionType = 'PRIMARY';
      }

      if (!this.definition.definitionLevel) {
        this.definition.definitionLevel = 'COMPLETE';
      }
      this.json = this.substanceFormService.getJson();
      if (this.definition.status) {
        this.status = this.definition.status;
      }
      if (this.definition.definitionType === 'ALTERNATIVE') {
        this.cvService.getDomainVocabulary('RELATIONSHIP_TYPE').subscribe(vocabularyResponse => {
          const type = vocabularyResponse['RELATIONSHIP_TYPE']
            && vocabularyResponse['RELATIONSHIP_TYPE'].dictionary['SUB_ALTERNATE->SUBSTANCE']
            && vocabularyResponse['RELATIONSHIP_TYPE'].dictionary['SUB_ALTERNATE->SUBSTANCE'].value
            || null;

          if (type && this.definition.relationships && this.definition.relationships.length) {
            const primarySubstance = this.definition.relationships.find(relationship => relationship.type === type);
            if (primarySubstance != null) {
              this.substanceService.getSubstanceSummary(primarySubstance.relatedSubstance.refuuid).subscribe(response => {
                this.primarySubstance = response;
                this.primarySubUuid = this.primarySubstance.uuid;
              });
            }
          }
        });
      }
      this.uuid = this.substanceFormService.getUuid();

    });

  }


  getRedirect() {
    if (this.uuid) {
      return this.substanceService.oldSiteRedirect('edit', this.substanceFormService.getUuid());
    } else {
      return '#';
    }
  }

  getVocabularies(): void {
    this.cvService.getDomainVocabulary('DEFINITION_TYPE', 'DEFINITION_LEVEL').subscribe(response => {
      this.definitionTypes = response['DEFINITION_TYPE'].list;
      this.definitionLevels = response['DEFINITION_LEVEL'].list;
    });
  }

  updateDefinitionType(event: MatSelectChange): void {
    if (this.definition.definitionType === 'PRIMARY' && this.definition.relationships != null && this.definition.relationships.length) {
      const indexToRemove = this.definition.relationships
        .findIndex((relationship) => relationship.relatedSubstance.refuuid === this.primarySubstance.uuid);
      if (indexToRemove > -1) {
        this.definition.relationships.splice(indexToRemove, 1);
      }
      this.primarySubstance = null;
    }
    this.substanceFormService.updateDefinition(this.definition);
  }

  primartySubstanceUpdated(substance?: SubstanceSummary): void {
    if (substance != null) {
      this.setPrimarySubstance(substance);
    } else {
      this.removePrimarySubstance();
    }
  }

  setPrimarySubstance(substance: SubstanceSummary): void {

    this.primarySubstance = substance;

    if (this.definition.relationships == null
      || Object.prototype.toString.call(this.definition.relationships) !== '[object Array]') {
      this.definition.relationships = [];
    }
    this.cvService.getDomainVocabulary('RELATIONSHIP_TYPE').subscribe(vocabularyResponse => {
      const relationship: SubstanceRelationship = {
        relatedSubstance: {
          refuuid: this.primarySubstance.uuid,
          refPname: this.primarySubstance._name,
          approvalID: this.primarySubstance.approvalID,
          substanceClass: 'reference'
        },
        access: [],
        type: vocabularyResponse['RELATIONSHIP_TYPE']
          && vocabularyResponse['RELATIONSHIP_TYPE'].dictionary['SUB_ALTERNATE->SUBSTANCE']
          && vocabularyResponse['RELATIONSHIP_TYPE'].dictionary['SUB_ALTERNATE->SUBSTANCE'].value
          || ''
      };
      this.definition.relationships.push(relationship);
      this.substanceFormService.updateDefinition(this.definition);
    });
  }

  removePrimarySubstance(): void {
    const indexToRemove = this.definition.relationships
      .findIndex((relationship) => relationship.relatedSubstance.refuuid === this.primarySubstance.uuid);
    this.definition.relationships.splice(indexToRemove, 1);
    this.primarySubstance = null;
    this.substanceFormService.updateDefinition(this.definition);
  }

  updateAccess(access: Array<string>): void {
    this.definition.access = access;
    this.substanceFormService.updateDefinition(this.definition);
  }

  updateDefinition(): void {
    this.substanceFormService.updateDefinition(this.definition);
  }


}
