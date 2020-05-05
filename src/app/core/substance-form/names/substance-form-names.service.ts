import { Injectable } from '@angular/core';
import { SubstanceFormNamesModule } from './substance-form-names.module';
import { SubstanceFormService } from '../substance-form.service';
import { SubstanceFormServiceBase } from '../base-classes/substance-form-service-base';
import { ReplaySubject, Observable } from 'rxjs';
import { SubstanceName } from '@gsrs-core/substance/substance.model';

@Injectable({
  providedIn: SubstanceFormNamesModule
})
export class SubstanceFormNamesService extends SubstanceFormServiceBase<Array<SubstanceName>> {

  constructor(
    public substanceFormService: SubstanceFormService
  ) {
    super(substanceFormService);
  }

  initSubtanceForm(): void {
    super.initSubtanceForm();
    const subscription = this.substanceFormService.substance.subscribe(substance => {
      this.substance = substance;
      if (this.substance.names == null) {
        this.substance.names = [];
      }
      this.substanceFormService.resetState();
      this.propertyEmitter.next(this.substance.names);
    });
    this.subscriptions.push(subscription);
    const namesUpdatedSubscription = this.substanceFormService.namesUpdated().subscribe(names => {
      this.propertyEmitter.next(names);
    });
    this.subscriptions.push(namesUpdatedSubscription);
  }

  get substanceNames(): Observable<Array<SubstanceName>> {
    return this.propertyEmitter.asObservable();
  }

  addSubstanceName(): void {
    const newName: SubstanceName = {
      references: [],
      access: []
    };
    this.substance.names.unshift(newName);
    this.propertyEmitter.next(this.substance.names);
  }

  deleteSubstanceName(name: SubstanceName): void {
    const subNameIndex = this.substance.names.findIndex(subName => name.$$deletedCode === subName.$$deletedCode);
    if (subNameIndex > -1) {
      this.substance.names.splice(subNameIndex, 1);
      this.propertyEmitter.next(this.substance.names);
    }
  }

  standardizeNames() {
    const bad = /[^ -~\t\n\r]/g;
    const rep = '\u2019;\';\u03B1;.ALPHA.;\u03B2;.BETA.;\u03B3;.GAMMA.;\u03B4;.DELTA.;\u03B5;.EPSILON.;\u03B6;.ZETA.;\u03B7;.ETA.;\u03B8;.THETA.;\u03B9;.IOTA.;\u03BA;.KAPPA.;\u03BB;.LAMBDA.;\u03BC;.MU.;\u03BD;.NU.;\u03BE;.XI.;\u03BF;.OMICRON.;\u03C0;.PI.;\u03C1;.RHO.;\u03C2;.SIGMA.;\u03C3;.SIGMA.;\u03C4;.TAU.;\u03C5;.UPSILON.;\u03C6;.PHI.;\u03C7;.CHI.;\u03C8;.PSI.;\u03C9;.OMEGA.;\u0391;.ALPHA.;\u0392;.BETA.;\u0393;.GAMMA.;\u0394;.DELTA.;\u0395;.EPSILON.;\u0396;.ZETA.;\u0397;.ETA.;\u0398;.THETA.;\u0399;.IOTA.;\u039A;.KAPPA.;\u039B;.LAMBDA.;\u039C;.MU.;\u039D;.NU.;\u039E;.XI.;\u039F;.OMICRON.;\u03A0;.PI.;\u03A1;.RHO.;\u03A3;.SIGMA.;\u03A4;.TAU.;\u03A5;.UPSILON.;\u03A6;.PHI.;\u03A7;.CHI.;\u03A8;.PSI.;\u03A9;.OMEGA.;\u2192;->;\xB1;+/-;\u2190;<-;\xB2;2;\xB3;3;\xB9;1;\u2070;0;\u2071;1;\u2072;2;\u2073;3;\u2074;4;\u2075;5;\u2076;6;\u2077;7;\u2078;8;\u2079;9;\u207A;+;\u207B;-;\u2080;0;\u2081;1;\u2082;2;\u2083;3;\u2084;4;\u2085;5;\u2086;6;\u2087;7;\u2088;8;\u2089;9;\u208A;+;\u208B;-'.split(';');
    const map = {};
    for (let s = 0; s < rep.length; s++) {
      if (s % 2 === 0) {
        const id = rep[s].charCodeAt(0);
        map[id] = rep[s + 1];
      }
    }

    function replacer(match, got) {
      return map[got.charCodeAt(0)];
    }

    this.substance.names.forEach(n => {
      if (n.name) {
        let name = n.name;
        name = name.replace(/([\u0390-\u03C9||\u2192|\u00B1-\u00B9|\u2070-\u208F|\u2190|])/g, replacer).trim();
        name = name.replace(bad, '');
        name = name.replace(/[[]([A-Z -.]*)\]$/g, ' !!@!$1_!@!');
        name = name.replace(/[ \t]+/g, ' ');
        name = name.replace(/[[]/g, '(');
        name = name.replace(/[{]/g, '(');
        name = name.replace(/\]/g, ')');
        name = name.replace(/\"/g, '\'\'');
        name = name.replace(/[}]/g, ')');
        name = name.replace(/\(([0-9]*CI,)*([0-9]*CI)\)$/gm, '');
        name = name.replace(/[ ]*-[ ]*/g, '-');
        name = name.trim();
        name = name.replace('!!@!', '[');
        name = name.replace('_!@!', ']');
        n.name = name.toUpperCase();
      }
    });
    this.propertyEmitter.next(this.substance.names);
  }
}
