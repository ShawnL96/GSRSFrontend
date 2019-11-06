import { Injectable } from '@angular/core';
import {
  SubstanceDetail,
  SubstanceReference,
  SubstanceName,
  SubstanceStructure,
  SubstanceMoiety,
  SubstanceCode,
  SubstanceRelationship,
  SubstanceNote,
  SubstanceProperty,
  Subunit,
  Link,
  DisulfideLink,
  Glycosylation,
  Site,
  AgentModification,
  PhysicalModification,
  StructuralModification,
  PhysicalModificationParameter, Protein, ProteinFeatures, Feature, Sugar, Linkage, NucleicAcid, MixtureComponents, Mixture
} from '../substance/substance.model';
import {
  SubstanceFormDefinition,
  SubstanceFormResults, ValidationResults
} from './substance-form.model';
import { Observable, Subject, observable } from 'rxjs';
import { SubstanceService } from '../substance/substance.service';
import { domainKeys, domainDisplayKeys } from './domain-references/domain-keys.constant';
import { UtilsService } from '../utils/utils.service';
import { StructureService } from '@gsrs-core/structure';
import { DomainsWithReferences } from './domain-references/domain.references.model';

@Injectable({
  providedIn: 'root'
})
export class SubstanceFormService {
  private substance: SubstanceDetail;
  private substanceEmitter = new Subject<SubstanceDetail>();
  private definitionEmitter = new Subject<SubstanceFormDefinition>();
  private substanceReferencesEmitter = new Subject<Array<SubstanceReference>>();
  private substanceNamesEmitter = new Subject<Array<SubstanceName>>();
  private substanceStructureEmitter = new Subject<SubstanceStructure>();
  private subClass: string;
  private computedMoieties: Array<SubstanceMoiety>;
  private deletedMoieties: Array<SubstanceMoiety> = [];
  private substanceMoietiesEmitter = new Subject<Array<SubstanceMoiety>>();
  private substanceCodesEmitter = new Subject<Array<SubstanceCode>>();
  private substanceRelationshipsEmitter = new Subject<Array<SubstanceRelationship>>();
  private privateDomainsWithReferences: DomainsWithReferences;
  private domainsWithReferencesEmitter = new Subject<DomainsWithReferences>();
  private substanceNotesEmitter = new Subject<Array<SubstanceNote>>();
  private substancePropertiesEmitter = new Subject<Array<SubstanceProperty>>();
  private substanceSubunitsEmitter = new Subject<Array<Subunit>>();
  private substanceOtherLinksEmitter = new Subject<Array<Link>>();
  private substanceDisulfideLinksEmitter = new Subject<Array<DisulfideLink>>();
  private substanceGlycosylationEmitter = new Subject<Glycosylation>();
  private substanceCysteineEmitter = new Subject<Array<Site>>();
  private substanceLinksEmitter = new Subject<Array<Linkage>>();
  private substanceSugarsEmitter = new Subject<Array<Sugar>>();
  private substanceAgentModificationsEmitter = new Subject<Array<AgentModification>>();
  private substancePhysicalModificationsEmitter = new Subject<Array<PhysicalModification>>();
  private substanceStructuralModificationsEmitter = new Subject<Array<StructuralModification>>();
  private substanceProteinEmitter = new Subject<Protein>();
  private substanceNucleicAcidEmitter = new Subject<NucleicAcid>();
  private substanceMixtureEmitter = new Subject<Mixture>();
  private substanceMixtureComponentsEmitter = new Subject<Array<MixtureComponents>>();
  private customFeaturesEmitter = new Subject<Array<Feature>>();
  private customFeatures: Array<Feature>;
  private cysteine: Array<Site>;
  private allSitesArr: Array<DisplaySite>;
  private allSitesEmitter = new Subject<Array<DisplaySite>>();
  constructor(
    private substanceService: SubstanceService,
    public utilsService: UtilsService,
    private structureService: StructureService
  ) { }

  loadSubstance(substanceClass: string = 'chemical', substance?: SubstanceDetail): void {
    setTimeout(() => {

      this.computedMoieties = null;
      this.deletedMoieties = [];
      this.privateDomainsWithReferences = null;
      if (substance != null) {
        this.substance = substance;
        console.log(this.substance);
        substanceClass = this.substance.substanceClass;
      } else {
        if (substanceClass == 'chemical') {
          this.substance = {
            substanceClass: substanceClass,
            references: [],
            names: [],
            structure: {},
            codes: [],
            relationships: [],
          };
        } else if (substanceClass === 'protein') {
          this.substance = {
            substanceClass: substanceClass,
            references: [],
            names: [],
            protein: {},
            codes: [],
            relationships: [],
          };
        } else if (substanceClass === 'nucleicAcid') {
          this.substance = {
            substanceClass: substanceClass,
            references: [],
            names: [],
            nucleicAcid: {},
            codes: [],
            relationships: [],
          };
        } else if (substanceClass === 'mixture') {
          this.substance = {
            substanceClass: substanceClass,
            references: [],
            names: [],
            nucleicAcid: {},
            codes: [],
            relationships: []
          };
        }
      }
      this.subClass = this.substance.substanceClass;

      if (this.subClass === 'chemical') {
        this.subClass = 'structure';
      } else if (this.subClass === 'specifiedSubstanceG1') {
        this.subClass = 'specifiedSubstance';
      } else if (this.subClass === 'protein') {
        this.subClass = 'protein';
      } else if (this.subClass === 'nucleicAcid') {
        this.subClass = 'nucleicAcid';
      } else if (this.subClass === 'mixture') {
        this.subClass = 'mixture';
      }

      if (this.substance[this.subClass] == null) {
        this.substance[this.subClass] = {};
      }

      if (this.substance.structure != null && this.substance.structure.molfile != null) {
        this.structureService.postStructure(this.substance.structure.molfile).subscribe(response => {
          this.computedMoieties = response.moieties;
          this.substanceEmitter.next(this.substance);
        });
      } else {
        this.substanceEmitter.next(this.substance);
      }
    });
  }

  unloadSubstance(): void {
    this.substance = null;
  }

  ready(): Observable<void> {
    return new Observable(observer => {
      if (this.substance != null) {
        observer.next();
        observer.complete();
      } else {
        const subscription = this.substanceEmitter.subscribe(substance => {
          observer.next();
          observer.complete();
          subscription.unsubscribe();
        });
      }
    });
  }

  getSubstanceValue(key: string): any {
    return this.substance[key];
  }

  // Definition Start

  get definition(): Observable<SubstanceFormDefinition> {
    return new Observable(observer => {
      this.ready().subscribe(() => {
        observer.next(this.getDefinition());
        this.definitionEmitter.subscribe(definition => {
          observer.next(this.getDefinition());
        });
      });
    });
  }

  updateDefinition(definition: SubstanceFormDefinition): void {
    this.substance.definitionType = definition.definitionType;
    this.substance.definitionLevel = definition.definitionLevel;
    this.substance.deprecated = definition.deprecated;
    this.substance.access = definition.access;
    if (this.substance[definition.substanceClass]) {
      this.substance[definition.substanceClass].references = definition.references;
    } else {
      this.substance[definition.substanceClass] = {
        references: definition.references
      };
    }
  }

  private getDefinition(): SubstanceFormDefinition {

    if (!this.substance[this.subClass]) {
      this.substance[this.subClass] = {
        references: []
      };
    }

    if (!this.substance[this.subClass].references) {
      this.substance[this.subClass].references = [];
    }

    const definition: SubstanceFormDefinition = {
      uuid: this.substance[this.subClass].uuid || this.substance[this.subClass].id,
      substanceClass: this.subClass,
      definitionType: this.substance.definitionType,
      definitionLevel: this.substance.definitionLevel,
      deprecated: this.substance.deprecated,
      references: this.substance[this.subClass].references,
      access: this.substance.access,
      relationships: this.substance.relationships
    };

    return definition;
  }

  // Definition end


  get allSites(): Observable<Array<DisplaySite>> {
    return new Observable(observer => {
      if (!this.allSitesArr) {
        this.allSitesArr = [];
      }
      this.allSitesArr = this.getAllSites();

      observer.next( this.allSitesArr);
      this.allSitesEmitter.subscribe(protein => {
        console.log(protein);
        observer.next( this.allSitesArr);
      });
    });
  }

  emitAllsitesUpdate(): void {
    this.substanceReferencesEmitter.next(this.getAllSites());
  }


  getAllSites(): Array<any> {

    let allSitesArr = [];

    if (this.substance.substanceClass === 'protein') {
    if (this.substance.protein.disulfideLinks) {
    this.substance.protein.disulfideLinks.forEach(link => {
      link.sites.forEach(site => {
      const newLink: DisplaySite = {residue: site.residueIndex, subunit: site.subunitIndex, type: 'disulfide'};
        allSitesArr.push(newLink);
      });
    });
    }
    if (this.substance.protein.otherLinks) {
      this.substance.protein.otherLinks.forEach(link => {
        if (link.sites) {
          link.sites.forEach(site => {
            const newLink: DisplaySite = {residue: site.residueIndex, subunit: site.subunitIndex, type: 'other'};
            allSitesArr.push(newLink);
          });
        }
      });
    }
    if (this.substance.protein.glycosylation) {
      const glycosylation = this.substance.protein.glycosylation;
      if (glycosylation.CGlycosylationSites) {
        glycosylation.CGlycosylationSites.forEach(site => {
          const newLink: DisplaySite = {residue: site.residueIndex, subunit: site.subunitIndex, type: 'Cglycosylation'};
          allSitesArr.push(newLink);
        });
      }
      if (glycosylation.NGlycosylationSites) {
        glycosylation.NGlycosylationSites.forEach(site => {
          const newLink: DisplaySite = {residue: site.residueIndex, subunit: site.subunitIndex, type: 'Nglycosylation'};
          allSitesArr.push(newLink);
        });
      }

      if (glycosylation.OGlycosylationSites) {
        glycosylation.OGlycosylationSites.forEach(site => {
          const newLink: DisplaySite = {residue: site.residueIndex, subunit: site.subunitIndex, type: 'Oglycosylation'};
          allSitesArr.push(newLink);
        });
      }
    }
    }
    if (this.substance.modifications.structuralModifications) {
      this.substance.modifications.structuralModifications.forEach(mod => {
        mod.sites.forEach(site => {
          const newLink: DisplaySite = {residue: site.residueIndex, subunit: site.subunitIndex, type: 'modification'};
          allSitesArr.push(newLink);
        });

      });
    }
    return allSitesArr;
  }

  // Class start

  get substanceProtein(): Observable<Protein> {
    return new Observable(observer => {
      this.ready().subscribe(substance => {
        if (this.substance.protein == null) {
          this.substance.protein = {proteinType:''};
        }
        observer.next(this.substance.protein);
        this.substanceProteinEmitter.subscribe(protein => {
          observer.next(this.substance.protein);
        });
      });
    });
  }

  updateProteinDetails(protein: Protein): void {
    this.substance.protein.proteinType = protein.proteinType;
    this.substance.protein.proteinSubType = protein.proteinSubType;
    this.substance.protein.sequenceOrigin = protein.sequenceOrigin;
    this.substance.protein.sequenceType = protein.sequenceType;
  }

  updateNucleicAcidDetails(acid: NucleicAcid): void {
    this.substance.nucleicAcid.nucleicAcidType = acid.nucleicAcidType;
    this.substance.nucleicAcid.nucleicAcidSubType = acid.nucleicAcidSubType;
    this.substance.nucleicAcid.sequenceOrigin = acid.sequenceOrigin;
    this.substance.nucleicAcid.sequenceType = acid.sequenceType;
  }

  get substanceNucleicAcid(): Observable<NucleicAcid> {
    return new Observable(observer => {
      this.ready().subscribe(substance => {
        if (this.substance.nucleicAcid == null) {
          this.substance.nucleicAcid = {nucleicAcidType:''};

        }
        observer.next(this.substance.nucleicAcid);
        this.substanceNucleicAcidEmitter.subscribe(protein => {
          observer.next(this.substance.nucleicAcid);
        });
      });
    });
  }



  // mixture start

  get substanceMixture(): Observable<Mixture> {
    return new Observable(observer => {
      this.ready().subscribe(substance => {
        if (this.substance.mixture == null) {
          this.substance.mixture = {};
        }
        observer.next(this.substance.mixture);
        this.substanceMixtureEmitter.subscribe(mixture => {
          observer.next(this.substance.mixture);
        });
      });
    });
  }

  get substanceMixtureComponents(): Observable<Array<SubstanceName>> {
    return new Observable(observer => {
      this.ready().subscribe(substance => {
        if (this.substance.mixture.components == null) {
          this.substance.mixture.components = [];
        }
        observer.next(this.substance.mixture.components);
        this.substanceMixtureComponentsEmitter.subscribe(names => {
          observer.next(this.substance.mixture.components);
        });
      });
    });
  }

  addSubstanceMixtureComponent(): void {
    const newMix: MixtureComponents = {
    };
    this.substance.names.unshift(newMix);
    this.substanceNamesEmitter.next(this.substance.mixture.components);
  }

  deleteSubstanceMixtureComponent(mix: MixtureComponents): void {
    const subNameIndex = this.substance.mixture.components.findIndex(subName => mix.$$deletedCode === subName.$$deletedCode);
    if (subNameIndex > -1) {
      this.substance.mixture.components.splice(subNameIndex, 1);
      this.substanceNamesEmitter.next(this.substance.mixture.components);
    }
  }
// Class end

  // References start

  get substanceReferences(): Observable<Array<SubstanceReference>> {
    return new Observable(observer => {
      this.ready().subscribe(substance => {
        if (this.substance.references == null) {
          this.substance.references = [];
        }
        observer.next(this.substance.references);
        this.substanceReferencesEmitter.subscribe(references => {
          observer.next(this.substance.references);
        });
      });
    });
  }

  addSubstanceReference(reference: SubstanceReference): SubstanceReference {
    reference.uuid = this.utilsService.newUUID();
    if (this.substance.references == null) {
      this.substance.references = [];
    }
    this.substance.references.unshift(reference);
    this.substanceReferencesEmitter.next(this.substance.references);
    return reference;
  }

  get domainsWithReferences(): Observable<DomainsWithReferences> {
    return new Observable(observer => {
      this.ready().subscribe(substance => {
        observer.next(this.getDomainReferences());
        this.domainsWithReferencesEmitter.subscribe(domains => {
          observer.next(this.getDomainReferences());
        });
      });
    });
  }

  getDomainReferences(): DomainsWithReferences {
    if (this.privateDomainsWithReferences == null) {
      this.privateDomainsWithReferences = {
        definition: {
          subClass: this.subClass,
          domain: this.substance[this.subClass]
        }
      };

      domainKeys.forEach(key => {
        this.privateDomainsWithReferences[key] = {
          listDisplay: key,
          displayKey: domainDisplayKeys[key],
          domains: this.substance[key]
        };
      });

    }

    return this.privateDomainsWithReferences;
  }

  deleteSubstanceReference(reference: SubstanceReference): void {
    const subRefIndex = this.substance.references.findIndex(subReference => reference.$$deletedCode === subReference.$$deletedCode);
    if (subRefIndex > -1) {
      this.substance.references.splice(subRefIndex, 1);
      this.substanceReferencesEmitter.next(this.substance.references);
    }
  }

  emitReferencesUpdate(): void {
    this.substanceReferencesEmitter.next(this.substance.references);
  }

  // References end

  // Names start

  get substanceNames(): Observable<Array<SubstanceName>> {
    return new Observable(observer => {
      this.ready().subscribe(substance => {
        if (this.substance.names == null) {
          this.substance.names = [];
        }
        observer.next(this.substance.names);
        this.substanceNamesEmitter.subscribe(names => {
          observer.next(this.substance.names);
        });
      });
    });
  }

  addSubstanceName(): void {
    const newName: SubstanceName = {
      references: [],
      access: []
    };
    this.substance.names.unshift(newName);
    this.substanceNamesEmitter.next(this.substance.names);
  }

  deleteSubstanceName(name: SubstanceName): void {
    const subNameIndex = this.substance.names.findIndex(subName => name.$$deletedCode === subName.$$deletedCode);
    if (subNameIndex > -1) {
      this.substance.names.splice(subNameIndex, 1);
      this.substanceNamesEmitter.next(this.substance.names);
    }
  }

  // Names end

  // Structure start

  get substanceStructure(): Observable<SubstanceStructure> {
    return new Observable(observer => {
      this.ready().subscribe(substance => {
        if (this.substance.structure == null) {
          this.substance.structure = {
            references: [],
            access: []
          };
        }
        observer.next(this.substance.structure);
        this.substanceStructureEmitter.subscribe(structure => {
          observer.next(this.substance.structure);
        });
      });
    });
  }

  get substanceMoieties(): Observable<Array<SubstanceMoiety>> {
    return new Observable(observer => {
      this.ready().subscribe(substance => {
        if (this.substance.moieties == null) {
          this.substance.moieties = [];
        }
        observer.next(this.substance.moieties);
        this.substanceMoietiesEmitter.subscribe(moieties => {
          observer.next(this.substance.moieties);
        });
      });
    });
  }

  updateMoieties(moieties: Array<SubstanceMoiety>): any {

    const moietiesCopy = moieties.slice();
    const substanceMoietiesCopy = this.substance.moieties.slice();

    this.substance.moieties.forEach((subMoiety, index) => {
      const matchingMoietyIndex = moietiesCopy.findIndex(moiety => moiety.hash === subMoiety.hash);

      if (matchingMoietyIndex > -1) {
        subMoiety.molfile = moietiesCopy[matchingMoietyIndex].molfile;

        const matchingComputedMoiety = this.computedMoieties.find(computedMoiety => computedMoiety.hash === subMoiety.hash);

        if (matchingComputedMoiety != null && moietiesCopy[matchingMoietyIndex].count !== matchingComputedMoiety.count) {
          subMoiety.count = moietiesCopy[matchingMoietyIndex].count;
          subMoiety.countAmount = moietiesCopy[matchingMoietyIndex].countAmount;
        }

        const substanceIndexToRemove = substanceMoietiesCopy.findIndex(moietyCopy => moietyCopy.hash === subMoiety.hash);
        const moietyIndexToRemove = moietiesCopy.findIndex(moietyCopy => moietyCopy.hash === subMoiety.hash);
        substanceMoietiesCopy.splice(substanceIndexToRemove, 1);
        moietiesCopy.splice(moietyIndexToRemove, 1);
      }
    });

    if (moietiesCopy.length > 0) {
      moietiesCopy.forEach(moietyCopy => {
        const moietyIndexInDeleted = this.deletedMoieties.findIndex(deletedMoiety => deletedMoiety.hash === moietyCopy.hash);

        if (moietyIndexInDeleted > -1) {
          const undeletedMoiety = this.deletedMoieties.splice(moietyIndexInDeleted, 1)[0];

          undeletedMoiety.molfile = moietyCopy.molfile;

          const matchingComputedMoiety = this.computedMoieties.find(computedMoiety => computedMoiety.hash === undeletedMoiety.hash);

          if (matchingComputedMoiety != null && moietyCopy.count !== matchingComputedMoiety.count) {
            undeletedMoiety.count = moietyCopy.count;
            undeletedMoiety.countAmount = moietyCopy.countAmount;
          }

          this.substance.moieties.push(undeletedMoiety);
        } else {
          moietyCopy.uuid = '';
          this.substance.moieties.push(moietyCopy);
        }
      });
    }

    if (substanceMoietiesCopy.length > 0) {
      substanceMoietiesCopy.forEach(subMoietyCopy => {
        const indexToDelete = this.substance.moieties.findIndex(subMoiety => subMoiety.hash === subMoietyCopy.hash);
        if (indexToDelete > -1) {
          const deletedMoiety = this.substance.moieties.splice(indexToDelete, 1)[0];
          this.deletedMoieties.push(deletedMoiety);
        }
      });
    }

    this.computedMoieties = moieties;

    this.substanceMoietiesEmitter.next(this.substance.moieties);
  }

  // Structure end

  // Codes start

  get substanceCodes(): Observable<Array<SubstanceCode>> {
    return new Observable(observer => {
      this.ready().subscribe(() => {
        if (this.substance.codes == null) {
          this.substance.codes = [];
        }
        observer.next(this.substance.codes);
        this.substanceCodesEmitter.subscribe(codes => {
          observer.next(this.substance.codes);
        });
      });
    });
  }

  addSubstanceCode(): void {
    const newCode: SubstanceCode = {
      references: [],
      access: []
    };
    this.substance.codes.unshift(newCode);
    this.substanceCodesEmitter.next(this.substance.codes);
  }

  deleteSubstanceCode(code: SubstanceCode): void {
    const subCodeIndex = this.substance.codes.findIndex(subCode => code.$$deletedCode === subCode.$$deletedCode);
    if (subCodeIndex > -1) {
      this.substance.codes.splice(subCodeIndex, 1);
      this.substanceCodesEmitter.next(this.substance.codes);
    }
  }

  // Codes end

  // Relationships start

  get substanceRelationships(): Observable<Array<SubstanceRelationship>> {
    return new Observable(observer => {
      this.ready().subscribe(() => {
        if (this.substance.relationships == null) {
          this.substance.relationships = [];
        }
        observer.next(this.substance.relationships);
        this.substanceRelationshipsEmitter.subscribe(relationships => {
          observer.next(this.substance.relationships);
        });
      });
    });
  }

  addSubstanceRelationship(): void {
    const newRelationship: SubstanceRelationship = {
      relatedSubstance: {},
      amount: {},
      references: [],
      access: []
    };
    this.substance.relationships.unshift(newRelationship);
    this.substanceRelationshipsEmitter.next(this.substance.relationships);
  }

  deleteSubstanceRelationship(relationship: SubstanceRelationship): void {
    const subRelationshipIndex = this.substance.relationships
      .findIndex(subRelationship => relationship.$$deletedCode === subRelationship.$$deletedCode);
    if (subRelationshipIndex > -1) {
      this.substance.relationships.splice(subRelationshipIndex, 1);
      this.substanceRelationshipsEmitter.next(this.substance.relationships);
    }
  }

  // Relationships end

  // Notes start

  get substanceNotes(): Observable<Array<SubstanceNote>> {
    return new Observable(observer => {
      this.ready().subscribe(() => {
        if (this.substance.notes == null) {
          this.substance.notes = [];
        }
        observer.next(this.substance.notes);
        this.substanceNotesEmitter.subscribe(notes => {
          observer.next(this.substance.notes);
        });
      });
    });
  }

  addSubstanceNote(): void {
    const newNote: SubstanceNote = {
      references: [],
      access: []
    };
    this.substance.notes.unshift(newNote);
    this.substanceNotesEmitter.next(this.substance.notes);
  }

  deleteSubstanceNote(note: SubstanceNote): void {
    const subNoteIndex = this.substance.notes.findIndex(subNote => note.$$deletedCode === subNote.$$deletedCode);
    if (subNoteIndex > -1) {
      this.substance.notes.splice(subNoteIndex, 1);
      this.substanceNotesEmitter.next(this.substance.notes);
    }
  }

  // Notes end

  // Properties start

  get substanceProperties(): Observable<Array<SubstanceProperty>> {
    return new Observable(observer => {
      this.ready().subscribe(() => {
        if (this.substance.properties == null) {
          this.substance.properties = [];
        }
        observer.next(this.substance.properties);
        this.substancePropertiesEmitter.subscribe(properties => {
          observer.next(this.substance.properties);
        });
      });
    });
  }

  addSubstanceProperty(): void {
    const newProperty: SubstanceProperty = {
      value: {},
      references: [],
      access: []
    };
    this.substance.properties.unshift(newProperty);
    this.substancePropertiesEmitter.next(this.substance.properties);
  }
  addSubstancePropertyFromFeature(feature: any): void {
    let type = 'NUCLEIC ACID FEATURE';
    if (this.substance.substanceClass === 'protein') {
      type = 'PROTEIN FEATURE';
    }
    const newProperty: SubstanceProperty = {
      value: {'nonNumericValue': feature.siteRange, 'type': 'Site Range'},
      propertyType: type,
      name: feature.name,
      references: [],
      access: []
    };
    this.substance.properties.unshift(newProperty);
    this.substancePropertiesEmitter.next(this.substance.properties);
  }
  deleteSubstanceProperty(property: SubstanceProperty): void {
    const subPropertyIndex = this.substance.properties.findIndex(subProperty => property.$$deletedCode === subProperty.$$deletedCode);
    if (subPropertyIndex > -1) {
      this.substance.properties.splice(subPropertyIndex, 1);
      this.substancePropertiesEmitter.next(this.substance.properties);
    }
  }

  // Properties end

  // Subunits start

  get substanceSubunits(): Observable<Array<Subunit>> {
    return new Observable(observer => {
      this.ready().subscribe(() => {
        if (this.substance.substanceClass === 'protein') {
          if (this.substance.protein.subunits == null) {
            this.substance.protein.subunits = [];
          }
          observer.next(this.substance.protein.subunits);
        } else {
          if (this.substance.nucleicAcid.subunits == null) {
            this.substance.protein.subunits = [];
          }
          observer.next(this.substance.nucleicAcid.subunits);
        }

        this.substanceSubunitsEmitter.subscribe(subunits => {
          if (this.substance.substanceClass === 'protein') {
            observer.next(this.substance.protein.subunits);
          } else {
            observer.next(this.substance.nucleicAcid.subunits);
          }
        });
      });
    });
  }


  addSubstanceSubunit(): void {
    if (this.substance.substanceClass === 'protein') {
      const index: number = this.substance.protein.subunits.length + 1;
      const newSubunit: Subunit = {
        references: [],
        access: [],
        sequence: '',
        subunitIndex: index
      };
      this.substance.protein.subunits.push(newSubunit);
      this.substanceCodesEmitter.next(this.substance.protein.subunits);
    } else {
      const index: number = this.substance.nucleicAcid.subunits.length + 1;
      const newSubunit: Subunit = {
        references: [],
        access: [],
        sequence: '',
        subunitIndex: index
      };
      this.substance.nucleicAcid.subunits.push(newSubunit);
      this.substanceCodesEmitter.next(this.substance.nucleicAcid.subunits);
    }

  }

  deleteSubstanceSubunit(subunit: Subunit): void {
    if (this.substance.substanceClass === 'protein') {
      const subUnitIndex = this.substance.protein.subunits.findIndex(subUnit => subunit.$$deletedCode === subUnit.$$deletedCode);
      if (subUnitIndex > -1) {
        this.substance.protein.subunits.splice(subUnitIndex, 1);
        this.substanceSubunitsEmitter.next(this.substance.protein.subunits);
      }
    } else {
      const subUnitIndex = this.substance.nucleicAcid.subunits.findIndex(subUnit => subunit.$$deletedCode === subUnit.$$deletedCode);
      if (subUnitIndex > -1) {
        this.substance.nucleicAcid.subunits.splice(subUnitIndex, 1);
        this.substanceSubunitsEmitter.next(this.substance.nucleicAcid.subunits);
      }
    }

  }

  emitSubunitUpdate(): void {
    if (this.substance.substanceClass === 'protein') {
      this.substanceSubunitsEmitter.next(this.substance.protein.subunits);
    } else {
      this.substanceSubunitsEmitter.next(this.substance.nucleicAcid.subunits);
    }
  }

  // subunits end

  // other links start

  get substanceOtherLinks(): Observable<Array<Link>> {
    return new Observable(observer => {
      this.ready().subscribe(() => {
        if (this.substance.protein.otherLinks == null) {
          this.substance.protein.otherLinks = [];
        }
        observer.next(this.substance.protein.otherLinks);
        this.substanceOtherLinksEmitter.subscribe(otherLinks => {
          observer.next(this.substance.protein.otherLinks );
        });
      });
    });
  }

  addSubstanceOtherLink(): void {
    const newOtherLinks: Link = {
      references: [],
      access: []
    };
    this.substance.protein.otherLinks.unshift(newOtherLinks);
    this.substanceCodesEmitter.next(this.substance.protein.otherLinks);
  }

  deleteSubstanceOtherLink(link: Link): void {
    const subLinkIndex = this.substance.protein.otherLinks.findIndex(subCode => link.$$deletedCode === subCode.$$deletedCode);
    if (subLinkIndex > -1) {
      this.substance.protein.otherLinks.splice(subLinkIndex, 1);
      this.substanceOtherLinksEmitter.next(this.substance.protein.otherLinks);
    }
  }

  emitOtherLinkUpdate(): void {
    this.substanceOtherLinksEmitter.next(this.substance.protein.otherLinks);
  }
  // other links end

  // disulfide links start

  get substanceDisulfideLinks(): Observable<Array<DisulfideLink>> {
    return new Observable(observer => {
      this.ready().subscribe(() => {
        if (this.substance.protein.disulfideLinks == null) {
          this.substance.protein.disulfideLinks = [];
        }
        observer.next(this.substance.protein.disulfideLinks);
        this.substanceDisulfideLinksEmitter.subscribe(disulfideLinks => {
          observer.next(this.substance.protein.disulfideLinks );
        });
      });
    });
  }

  addSubstanceDisulfideLink(): void {
    const newDisulfideLinks: DisulfideLink = {
    };
    this.substance.protein.disulfideLinks.unshift(newDisulfideLinks);
    this.substanceDisulfideLinksEmitter.next(this.substance.protein.disulfideLinks);
  }

  deleteSubstanceDisulfideLink(disulfideLink: DisulfideLink): void {
    const subLinkIndex = this.substance.protein.disulfideLinks.findIndex(subLink => disulfideLink.$$deletedCode === subLink.$$deletedCode);
    if (subLinkIndex > -1) {
      this.substance.protein.disulfideLinks.splice(subLinkIndex, 1);
      this.substanceDisulfideLinksEmitter.next(this.substance.protein.disulfideLinks);
    }
  }

  emitDisulfideLinkUpdate(): void {
    this.substanceDisulfideLinksEmitter.next(this.substance.protein.disulfideLinks);
    this.recalculateCysteine();
  }
  // disulfide links end

  // Glycosylation start

  get substanceGlycosylation(): Observable<Glycosylation> {
    return new Observable(observer => {
      this.ready().subscribe(() => {
        if (this.substance.protein.glycosylation == null) {
          this.substance.protein.glycosylation = {};
        }
        observer.next(this.substance.protein.glycosylation);
        this.substanceGlycosylationEmitter.subscribe(glycosylation => {
          observer.next(this.substance.protein.glycosylation );
        });
      });
    });
  }

  emitGlycosylationUpdate(): void {
    this.substanceGlycosylationEmitter.next(this.substance.protein.glycosylation);
  }

  // Glycosylation end

  // modifications start

  get substanceAgentModifications(): Observable<Array<AgentModification>> {
    return new Observable(observer => {
      this.ready().subscribe(() => {
        if (!this.substance.modifications || this.substance.modifications.agentModifications == null) {
          this.substance.modifications.agentModifications = [];
        }
        observer.next(this.substance.modifications.agentModifications);
        this.substanceAgentModificationsEmitter.subscribe(agentModifications => {
          observer.next(this.substance.modifications.agentModifications );
        });
      });
    });
  }

  addSubstanceAgentModification(): void {
    const newAgentModifications: AgentModification = {
    };
    this.substance.modifications.agentModifications.unshift(newAgentModifications);
    this.substanceAgentModificationsEmitter.next(this.substance.modifications.agentModifications);
  }

  deleteSubstanceAgentModification(agentModification: AgentModification): void {
    const agentModIndex = this.substance.modifications.agentModifications.findIndex(agentMod => agentModification.$$deletedCode === agentMod.$$deletedCode);
    if (agentModIndex > -1) {
      this.substance.modifications.agentModifications.splice(agentModIndex, 1);
      this.substanceAgentModificationsEmitter.next(this.substance.modifications.agentModifications);
    }
  }

// modifications end

// modifications start

  get substancePhysicalModifications(): Observable<Array<PhysicalModification>> {
    this.checkModifications();
      return new Observable(observer => {
      this.ready().subscribe(() => {
        if (!this.substance.modifications || this.substance.modifications.physicalModifications == null) {
          this.substance.modifications.physicalModifications = [];
        }
        observer.next(this.substance.modifications.physicalModifications);
        this.substancePhysicalModificationsEmitter.subscribe(physicalModifications => {
          observer.next(this.substance.modifications.physicalModifications );
        });
      });
    });
  }

  addSubstancePhysicalModification(): void {
    const newPhysicalModifications: PhysicalModification = {
    };
    this.substance.modifications.physicalModifications.unshift(newPhysicalModifications);
    this.substancePhysicalModificationsEmitter.next(this.substance.modifications.physicalModifications);
  }

  deleteSubstancePhysicalModification(physicalModification: PhysicalModification): void {
    const physicalModIndex = this.substance.modifications.physicalModifications.findIndex(physicalMod => physicalModification.$$deletedCode === physicalMod.$$deletedCode);
    if (physicalModIndex > -1) {
      this.substance.modifications.physicalModifications.splice(physicalModIndex, 1);
      this.substancePhysicalModificationsEmitter.next(this.substance.modifications.physicalModifications);
    }
  }

// modifications end

  // modifications start

  get substanceStructuralModifications(): Observable<Array<StructuralModification>> {
    this.checkModifications();
      return new Observable(observer => {
      this.ready().subscribe(() => {
        if (!this.substance.modifications || this.substance.modifications.structuralModifications == null) {
          this.substance.modifications.structuralModifications = [];
        }
        observer.next(this.substance.modifications.structuralModifications);
        this.substanceStructuralModificationsEmitter.subscribe(structuralModifications => {
          observer.next(this.substance.modifications.structuralModifications );
        });
      });
    });
  }

  addSubstanceStructuralModification(): void {
    this.checkModifications();
      const newStructuralModifications: StructuralModification = {
    };
    this.substance.modifications.structuralModifications.unshift(newStructuralModifications);
    this.substanceStructuralModificationsEmitter.next(this.substance.modifications.structuralModifications);
  }

  deleteSubstanceStructuralModification(structuralModification: StructuralModification): void {
    const structuralModIndex = this.substance.modifications.structuralModifications.findIndex(structuralMod => structuralModification.$$deletedCode === structuralMod.$$deletedCode);
    if (structuralModIndex > -1) {
      this.substance.modifications.structuralModifications.splice(structuralModIndex, 1);
      this.substanceStructuralModificationsEmitter.next(this.substance.modifications.structuralModifications);
    }
  }

  emitStructralModificationsUpdate(): void {
    this.substanceStructuralModificationsEmitter.next(this.substance.modifications.structuralModifications);
  }



  checkModifications(): void {
      if (!this.substance.modifications || this.substance.modifications === null) {
        this.substance.modifications = {
          agentModifications:[],
          structuralModifications:[],
          physicalModifications:[]
        };
      }
  }
// modifications end

  // Cysteine start

  emitCysteineUpdate(cysteine: Array<Site>): void {
    this.substanceCysteineEmitter.next(cysteine);
  }

  recalculateCysteine(): void {
    let available = [];
    for (let i = 0; i < this.substance.protein.subunits.length; i++) {
      const sequence = this.substance.protein.subunits[i].sequence;
      for (let j = 0; j < sequence.length; j++) {
        const site = sequence[j];
        if (site.toUpperCase() === 'C') {
          available.push({'residueIndex': (j + 1), 'subunitIndex': (i + 1)});
        }
      }
    }

    this.substance.protein.disulfideLinks.forEach(link => {
      if (link.sites) {
        link.sites.forEach(site => {
          available = available.filter(r => (r.residueIndex != site.residueIndex) || (r.subunitIndex != site.subunitIndex));
        });
      }
    });
    this.substanceCysteineEmitter.next(available);
  }

  get substanceCysteineSites(): Observable< Array<Site>> {
    return new Observable(observer => {
      this.ready().subscribe(() => {
        let available = [];
        for (let i = 0; i < this.substance.protein.subunits.length; i++) {
          const sequence = this.substance.protein.subunits[i].sequence;
          for (let j = 0; j < sequence.length; j++) {
            const site = sequence[j];
            if (site.toUpperCase() === 'C') {
              available.push({'residueIndex': (j + 1), 'subunitIndex': (i + 1)});
            }
          }
        }

        this.substance.protein.disulfideLinks.forEach(link => {
          if (link.sites) {
            link.sites.forEach(site => {
              available = available.filter(r => (r.residueIndex != site.residueIndex) || (r.subunitIndex != site.subunitIndex));
            });
          }
        });
        this.cysteine = available;
        observer.next(available);
        this.substanceCysteineEmitter.subscribe(disulfideLinks => {
          this.cysteine = disulfideLinks;
          observer.next(disulfideLinks);
        });
      });
    });
  }


  //custom sites for proteins

  emitCustomFeaturesUpdate(): void {
    this.customFeaturesEmitter.next(this.customFeatures);
  }


  get CustomFeatures(): Observable<Array<Feature>> {
    return new Observable(observer => {
      this.ready().subscribe(() => {
        if (this.customFeatures == null) {
          this.customFeatures = [];
        }
        observer.next(this.customFeatures);
        this.customFeaturesEmitter.subscribe(disulfideLinks => {
          observer.next(this.customFeatures);
        });
      });
    });
  }



  // ################################ Start Nucleic acid (break into new file, one for each class or on with only class specific?

  // begin link

  get substanceLinks(): Observable<Array<Link>> {
    return new Observable(observer => {
      this.ready().subscribe(() => {
        if (this.substance.nucleicAcid.linkages == null) {
          this.substance.nucleicAcid.linkages = [];
        }
        observer.next(this.substance.nucleicAcid.linkages);
        this.substanceLinksEmitter.subscribe(links => {
          observer.next(this.substance.nucleicAcid.linkages );
        });
      });
    });
  }

  addSubstanceLink(): void {
    const newLinks: Link = {
      sites: []
    };
    this.substance.nucleicAcid.linkages.unshift(newLinks);
    this.substanceLinksEmitter.next(this.substance.nucleicAcid.linkages);
  }

  deleteSubstanceLink(link: Link): void {
    const subLinkIndex = this.substance.nucleicAcid.linkages.findIndex(subCode => link.$$deletedCode === subCode.$$deletedCode);
    if (subLinkIndex > -1) {
      this.substance.nucleicAcid.linkages.splice(subLinkIndex, 1);
      this.substanceLinksEmitter.next(this.substance.nucleicAcid.linkages);
    }
  }

  emitLinkUpdate(): void {
    this.substanceLinksEmitter.next(this.substance.nucleicAcid.linkages);
  }


  // begin sugars

  get substanceSugars(): Observable<Array<Sugar>> {
    return new Observable(observer => {
      this.ready().subscribe(() => {
        if (this.substance.nucleicAcid.sugars == null) {
          this.substance.nucleicAcid.sugars = [];
        }
        observer.next(this.substance.nucleicAcid.sugars);
        this.substanceSugarsEmitter.subscribe(sugars => {
          observer.next(this.substance.nucleicAcid.sugars );
        });
      });
    });
  }

  addSubstanceSugar(): void {
    const newSugars: Sugar = {
      sites: [],
      sugar: ''
    };
    this.substance.nucleicAcid.sugars.unshift(newSugars);
    this.substanceSugarsEmitter.next(this.substance.nucleicAcid.sugars);
  }

  deleteSubstanceSugar(sugar: Sugar): void {
    const subSugarIndex = this.substance.nucleicAcid.sugars.findIndex(subCode => sugar.$$deletedCode === subCode.$$deletedCode);
    if (subSugarIndex > -1) {
      this.substance.nucleicAcid.sugars.splice(subSugarIndex, 1);
      this.substanceSugarsEmitter.next(this.substance.nucleicAcid.sugars);
    }
  }

  emitSugarUpdate(): void {
    this.substanceSugarsEmitter.next(this.substance.nucleicAcid.sugars);
  }

  // end sugars

  validateSubstance(): Observable<ValidationResults> {
    return new Observable(observer => {
      const substanceCopy = this.removeDeletedComponents();
      this.substanceService.validateSubstance(substanceCopy).subscribe(results => {
        observer.next(results);
        observer.complete();
      }, error => {
        observer.error();
        observer.complete();
      });
    });
  }

  removeDeletedComponents(): SubstanceDetail {
    let substanceString = JSON.stringify(this.substance);
    let substanceCopy: SubstanceDetail = JSON.parse(substanceString);
    const deletablekeys = [
      'names',
      'codes',
      'relationships',
      'notes',
      'properties',
      'references'
    ];
    const deletedReferenceUuids = [];

    deletablekeys.forEach(property => {
      if (substanceCopy[property] && substanceCopy[property].length) {

        substanceCopy[property] = substanceCopy[property].map((item: any) => {
          const hasDeleletedCode = item.$$deletedCode != null;
          if (!hasDeleletedCode) {
            delete item.$$deletedCode;
            return item;
          } else if (property === 'references') {
            deletedReferenceUuids.push(item.uuid);
          }
        });
      }
    });

    if (deletedReferenceUuids.length > 0) {
      substanceString = JSON.stringify(substanceCopy);

      deletedReferenceUuids.forEach(uuid => {
        substanceString = substanceString.replace(new RegExp(`"${uuid}"`, 'g'), '');
      });
      substanceString = substanceString.replace(/,,/g, ',');
      substanceString = substanceString.replace(/\[,/g, '[');
      substanceString = substanceString.replace(/,\]/g, ']');
      substanceCopy = JSON.parse(substanceString);
    }

    return substanceCopy;
  }

  saveSubstance(): Observable<SubstanceFormResults> {
    return new Observable(observer => {
      const results: SubstanceFormResults = {
        isSuccessfull: true
      };
      if (this.substance.structure != null && !this.substance.structure.uuid) {
        this.substance.structure.id = this.utilsService.newUUID();
        this.substance.structure.uuid = this.substance.structure.id;
      }
      if (this.substance.moieties != null && this.substance.moieties.length) {
        this.substance.moieties.forEach(moiety => {
          if (!moiety.uuid) {
            moiety.id = this.utilsService.newUUID();
            moiety.uuid = moiety.id;
          }
        });
      }

      const substanceCopy = this.removeDeletedComponents();
      if (this.substance.protein) {
      }
      this.substanceService.saveSubstance(substanceCopy).subscribe(substance => {
        this.substance = substance;
        results.uuid = substance.uuid;
        this.definitionEmitter.next(this.getDefinition());
        if (this.substance.substanceClass === 'protein') {
          this.substanceOtherLinksEmitter.next(this.substance.protein.otherLinks);
          this.substanceDisulfideLinksEmitter.next(this.substance.protein.disulfideLinks);
          this.substanceGlycosylationEmitter.next(this.substance.protein.glycosylation);
          this.substanceSubunitsEmitter.next(this.substance.protein.subunits);
        } else if (this.substance.substanceClass === 'nucleicAcid') {
          this.substanceLinksEmitter.next(this.substance.nucleicAcid.linkages);
          this.substanceSugarsEmitter.next(this.substance.nucleicAcid.sugars);
          this.substanceSubunitsEmitter.next(this.substance.nucleicAcid.subunits);
        } else if (this.substance.substanceClass === 'mixture') {
          this.substanceMixtureEmitter.next(this.substance.mixture);
          this.substanceSubunitsEmitter.next(this.substance.mixture.components);
        }
        this.substanceReferencesEmitter.next(this.substance.references);
        this.domainsWithReferencesEmitter.next(this.getDomainReferences());
        this.substanceNamesEmitter.next(this.substance.names);
        this.substanceStructureEmitter.next(this.substance.structure);
        this.substanceMoietiesEmitter.next(this.substance.moieties);
        this.substanceCodesEmitter.next(this.substance.codes);
        this.substanceRelationshipsEmitter.next(this.substance.relationships);
        this.substanceNamesEmitter.next(this.substance.notes);
        this.substancePropertiesEmitter.next(this.substance.properties);
        this.substanceAgentModificationsEmitter.next(this.substance.modifications.agentModifications);
        this.substancePhysicalModificationsEmitter.next(this.substance.modifications.physicalModifications);
        this.substanceStructuralModificationsEmitter.next(this.substance.modifications.structuralModifications);
        observer.next(results);
        observer.complete();
      }, error => {
        results.isSuccessfull = false;
        if (error && error.error && error.error.validationMessages) {
          results.validationMessages = error.error.validationMessages;
        }
        observer.error(results);
        observer.complete();
      });
    });
  }

  siteDisplayToSite(site) {
    const subres = site.split('_');

    if (site.match(/^[0-9][0-9]*_[0-9][0-9]*$/g) === null) {
      throw new Error('"' + site + '" is not a valid shorthand for a site. Must be of form "{subunit}_{residue}"');
    }

    return {
      subunitIndex: subres[0] - 0,
      residueIndex: subres[1] - 0
    };
  }

  stringToSites (slist: string): Array<Site> {
    slist = slist.replace(/ /g, '');
      if (!slist) {return []; }
      const toks = slist.split(';');
    const  sites = [];
      for (const i in toks) {
        const  l = toks[i];
        if (l === '') {continue; }
        const  rng = l.split('-');
        if (rng.length > 1) {
          const site1 = this.siteDisplayToSite(rng[0]);
          const site2 = this.siteDisplayToSite(rng[1]);
          if (site1.subunitIndex != site2.subunitIndex) {
            throw new Error('"' + rng + '" is not a valid shorthand for a site range. Must be between the same subunits.');
          }
          if (site2.residueIndex <= site1.residueIndex) {
            throw new Error('"' + rng + '" is not a valid shorthand for a site range. Second residue index must be greater than first.');
          }
          sites.push(site1);
          for (let j = site1.residueIndex + 1; j < site2.residueIndex; j++) {
            sites.push({
              subunitIndex: site1.subunitIndex,
              residueIndex: j
            });
          }
          sites.push(site2);
        } else {
          sites.push(this.siteDisplayToSite(rng[0]));
        }
      }
      return sites;
  }

  siteString(sites: Array<Site>): string {

    if (!sites || sites.length === 0) {
      return '';
    }
    if (sites.length === 1) {
      return sites[0].subunitIndex + '_' + sites[0].residueIndex;
    }
    {
      sites.sort(function (site1, site2) {
        let d = site1.subunitIndex - site2.subunitIndex;
        if (d === 0) {
          d = site1.residueIndex - site2.residueIndex;
        }
        return d;

      });
      let csub = 0;
      let cres = 0;
      let rres = 0;
      let finish = false;
      let disp = '';
      for (let i = 0; i < sites.length; i++) {

        const site = sites[i];
        if (site.subunitIndex == csub && site.residueIndex == cres) {
          continue;
        }
        finish = false;
        if (site.subunitIndex == csub) {
          if (site.residueIndex == cres + 1) {
            if (rres === 0) {
              rres = cres;
            }
          } else {
            finish = true;
          }
        } else {
          finish = true;
        }
        if (finish && csub !== 0) {
          if (rres !== 0) {
            disp += csub + '_' + rres + '-' + csub + '_' + cres + '; ';
          } else {
            disp += csub + '_' + cres + '; ';
          }
          rres = 0;
        }
        csub = site.subunitIndex;
        cres = site.residueIndex;
      }
      if (sites.length > 0) {
        if (rres !== 0) {
          disp += csub + '_' + rres + '-' + csub + '_' + cres;
        } else {
          disp += csub + '_' + cres;
        }
      }
      return disp;
    }
  }
}


    interface DisplaySite {
      type: string;
      subunit: number;
      residue: number;
    }
