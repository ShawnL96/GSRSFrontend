export interface ApplicationSrs {
  id?: number;
  appType?: string;
  appNumber?: string;
  title?: string;
  sponsorName?: string;
  nonProprietaryName?: string;
  submitDate?: string;
  appSubType?: string;
  divisionClassDesc?: string;
  status?: string;
  center?: string;
  source?: string;
  publicDomain?: string;
  version?: number;
  provenance?: string;
  externalTitle?: string;
  statusDate?: number;
  createdBy?: string;
  createDate?: number;
  modifiedBy?: string;
  modifyDate?: number;
  internalVersion?: number;
  isDisabled?: boolean;
  applicationProductList?: Array<ProductSrs>;
  applicationIndicationList?: Array<ApplicationIndicationSrs>;
  clinicalTrialList?: Array<ClinicalTrial>;
  productTechEffectList?: Array<ProductTechnicalEffect>;
  productEffectedList?: Array<ProductEffected>;
  applicationHistoryList?: Array<ApplicationSrsHistory>;
}

export interface ProductSrs {
  id?: number;
  productName?: string;
  amount?: number;
  dosageForm?: string;
  routeAdmin?: string;
  unitPresentation?: string;
  unit?: string;
  reviewedBy?: string;
  reviewDate?: number;
  createdBy?: string;
  createDate?: number;
  modifiedBy?: string;
  modifyDate?: number;
  internalVersion?: number;
  applicationProductNameList?: Array<ProductNameSrs>;
  applicationIngredientList?: Array<ApplicationIngredient>;
}

export interface ProductNameSrs {
  id?: number;
  productName?: string;
  productNameType?: string;
  createdBy?: string;
  createDate?: number;
  modifiedBy?: string;
  modifyDate?: number;
  internalVersion?: number;
}

export interface ApplicationIngredient {
  id?: number;
  applicantIngredName?: string;
  bdnum?: string;
  basisOfStrengthBdnum?: string;
  internalVersion?: number;
  substanceId?: string;
  ingredientName?: string;
  activeMoietyUnii?: string;
  activeMoietyName?: string;
  createdBy?: string;
  createDate?: number;
  modifiedBy?: string;
  modifyDate?: number;
  average?: string;
  low?: string;
  high?: string;
  ingredientType?: string;
  unit?: string;
  farmSubstanceId?: number;
  farmSubstance?: string;
  reviewedBy?: string;
  reviewDate?: number;
  grade?: string;
  basisOfStrengthName?: string;
  ingBasisMessage?: string;
  ingNameMessage?: string;
  basisOfStrengthSubstanceId?: string;
  subRelationshipList?: Array<SubRelationship>;
}

export interface SubRelationship {
  id?: string;
  substanceId?: string;
  ownerBdnum?: string;
  relationshipType?: string;
  relationshipName?: string;
  relationshipUnii?: string;
}

export interface ApplicationIndicationSrs {
  id?: number;
  indication?: string;
  amount?: number;
  dosageForm?: string;
  routeAdmin?: string;
  unitPresentation?: string;
  unit?: string;
  reviewedBy?: string;
  reviewDate?: number;
  internalVersion?: number;
}

export interface ProductTechnicalEffect {
  id?: number;
  technicalEffect?: string;
  farmTechEffectId?: number;
  substanceId?: number;
  createdBy?: string;
  createDate?: number;
  internalVersion?: number;
}

export interface ProductEffected {
  id?: number;
  effectedProduct?: string;
  farmProductId?: number;
  substanceId?: number;
  createdBy?: string;
  createDate?: number;
  internalVersion?: number;
}

export interface ApplicationSrsHistory {
  id?: number;
  productName?: string;
  sponsorName?: string;
  status?: string;
  statusDate?: number;
  createDate?: number;
}

export interface ClinicalTrial {
  nctNumber?: String;
}
