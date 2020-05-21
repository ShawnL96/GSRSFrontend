import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { SubstanceService } from '@gsrs-core/substance/substance.service';
import { AuthService } from '@gsrs-core/auth';
import { SubstanceReference } from '@gsrs-core/substance/substance.model';

@Component({
  selector: 'app-previous-references',
  templateUrl: './previous-references.component.html',
  styleUrls: ['./previous-references.component.scss']
})
export class PreviousReferencesComponent implements OnInit {
  user: string;
  refCount: number;
  loading = true;
oldReferences: Array<SubstanceReference> = [];
displayedColumns: string[] = ['use', 'citation', 'type', 'tags', 'dateAcessed'];
@Output() selectedReference = new EventEmitter<SubstanceReference>();
  constructor(
    private substanceService: SubstanceService,
    private authService: AuthService) { }

  ngOnInit() {
    this.user =  this.authService.getUser();
    this.substanceService.getSubstanceReferences(1, 1).subscribe( response => {
      if (response.total) {
        this.refCount = response.total;
      } else {
        this.refCount = 0;
      }
      this.getPreviousReferences();
    });
  }

  getPreviousReferences(): void {
    let skip = this.refCount - 100;

    if (this.refCount < 100) {
      skip = 0;
    }
    this.substanceService.getSubstanceReferences(100, skip).subscribe( response => {
      if (response.count && response.content) {
        for (let i = (response.content.length - 1); i >= 0; i--) {

          if (this.user === response.content[i]['lastEditedBy']
              && response.content[i]['docType'] !==  'VALIDATION_MESSAGE'
              && response.content[i]['docType'] !==  'SYSTEM' ) {
            this.oldReferences.push(response.content[i]);
            if (this.oldReferences.length >= 10) {
              break;
            }
          }
        }
        this.loading = false;
        console.log(this.oldReferences);
      }
    });
  }

  selectReference(ref: SubstanceReference) {
    this.selectedReference.emit(ref);
  }

}
