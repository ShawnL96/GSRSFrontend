import { Component, OnInit, Input } from '@angular/core';
import { domainKeys } from '../domain-references/domain-keys.constant';
import { DomainsWithReferences } from '../domain-references/domain.references.model';
import { SubstanceFormService } from '../substance-form.service';
import { MatCheckboxChange } from '@angular/material/checkbox';

@Component({
  selector: 'app-apply-reference',
  templateUrl: './apply-reference.component.html',
  styleUrls: ['./apply-reference.component.scss']
})
export class ApplyReferenceComponent implements OnInit {
  domainKeys = domainKeys;
  domainsWithReferences: DomainsWithReferences;
  private privateSubReferenceUuid: string;

  constructor(
    private substanceFormService: SubstanceFormService
  ) { }

  ngOnInit() {
    this.substanceFormService.domainsWithReferences.subscribe(domainsWithReferences => {
      this.domainsWithReferences = domainsWithReferences;
    });
  }

  @Input()
  set subReferenceUuid(uuid: string) {
    this.privateSubReferenceUuid = uuid;
  }

  applyToAll(): void {
    this.applyReference(this.domainsWithReferences.definition.domain);
    this.domainKeys.forEach(key => {
      this.domainsWithReferences[key].domains.forEach(domain => {
        this.applyReference(domain);
      });
    });
  }

  applyToAllDomain(domainKey: string): void {
    this.domainsWithReferences[domainKey].domains.forEach(domain => {
      this.applyReference(domain);
    });
  }

  updateAppliedOtion(event: MatCheckboxChange, domain: any): void {
    if (event.checked) {
      this.applyReference(domain);
    } else {
      this.removeReference(domain);
    }
  }

  applyReference(domain: any): void {
    if (!domain.references) {
      domain.references = [];
    }
    if (domain.references.indexOf(this.privateSubReferenceUuid) === -1) {
      domain.references.push(this.privateSubReferenceUuid);
    }
  }

  removeReference(domain: any): void {
    if (domain.references && domain.references.length) {
      const referenceUuidIndex = domain.references.indexOf(this.privateSubReferenceUuid);

      if (referenceUuidIndex > -1) {
        domain.references.splice(this.privateSubReferenceUuid, 1);
      }
    }
  }

  getDomainDisplay(obj: any, path: string, defaultValue: any = null): string {
    return String.prototype.split.call(path, /[,[\].]+?/)
      .filter(Boolean)
      .reduce((a: any, c: string) => (Object.hasOwnProperty.call(a, c) ? a[c] : defaultValue), obj);
  }

  isApplied(domain: any): boolean {
    return domain.references && domain.references.indexOf(this.privateSubReferenceUuid) > -1;
  }

}