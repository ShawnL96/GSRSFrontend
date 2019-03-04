import { Component, OnInit } from '@angular/core';
import { SubstanceCardBase } from '../substance-card-base';
import { SubstanceRelationship } from '../../substance/substance.model';
import { SafeUrl } from '@angular/platform-browser';
import {UtilsService} from '../../utils/utils.service';
import { ConfigService } from '../../config/config.service';

@Component({
  selector: 'app-substance-relationships',
  templateUrl: './substance-relationships.component.html',
  styleUrls: ['./substance-relationships.component.scss']
})
export class SubstanceRelationshipsComponent extends SubstanceCardBase implements OnInit {
  type: string;
  relationships: Array<SubstanceRelationship> = [];
  displayedColumns = ['relatedRecord', 'mediatorRecord', 'type', 'details'];

  constructor(
    private utilService: UtilsService,
    private configService: ConfigService
  ) {
    super();
  }

  ngOnInit() {
    if (this.substance != null && this.type != null) {
      this.filterRelationhships();
    }
  }

  private filterRelationhships(): void {
    if (this.substance.relationships && this.substance.relationships.length > 1) {
      this.substance.relationships.forEach(relationship => {
        const typeParts = relationship.type.split('->');
        const property = typeParts && typeParts.length && typeParts[0].trim() || '';
        if (property.indexOf(this.type) > -1) {
          this.relationships.push(relationship);
        } else if (this.type === 'RELATIONSHIPS') {
          let isSpecialRelationship = false;

          if (this.configService.configData.specialRelationships && this.configService.configData.specialRelationships.length) {
            for (let i = 0; i < this.configService.configData.specialRelationships.length; i++) {
              if (property.toLowerCase().indexOf(this.configService.configData.specialRelationships[i].type.toLowerCase()) > -1) {
                isSpecialRelationship = true;
                break;
              }
            }
          }

          if (!isSpecialRelationship) {
            this.relationships.push(relationship);
          }
        }
      });
    }
  }

  getSafeStructureImgUrl(structureId: string, size: number = 150): SafeUrl {
    return this.utilService.getSafeStructureImgUrl(structureId, size);
  }

}
