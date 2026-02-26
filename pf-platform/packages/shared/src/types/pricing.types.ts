export enum BuildingType {
  HOUSE_2_RESIDENTS = 'house_2_residents',
  HOUSE_3_RESIDENTS = 'house_3_residents',
  VILLA_1_RESIDENT = 'villa_1_resident',
  VILLA_2_RESIDENTS = 'villa_2_residents',
}

export enum DesignCategory {
  BASIC = 'basic',
  IMPROVED_LIVEABILITY = 'improved_liveability',
  FULLY_ACCESSIBLE = 'fully_accessible',
  ROBUST = 'robust',
  HIGH_PHYSICAL_SUPPORT = 'high_physical_support',
}

export interface SdaPricingInput {
  buildingType: BuildingType;
  designCategory: DesignCategory;
  locationFactor: number;
  hasOoa: boolean;
  hasBreakoutRoom: boolean;
  hasFireSprinklers: boolean;
  financialYear?: string;
}

export interface SdaPricingResult {
  baseAnnualRate: number;
  ooaSupplement: number;
  breakoutSupplement: number;
  fireSprinklerSupplement: number;
  subtotalBeforeLocation: number;
  locationFactor: number;
  annualSdaAmount: number;
  monthlySdaAmount: number;
  dailySdaAmount: number;
}

export interface MrrcInput {
  dspBasicFortnight: number;
  pensionSuppFortnight: number;
  craMaxFortnight: number;
}

export interface MrrcResult {
  dspComponent: number;       // 25% of DSP
  pensionComponent: number;   // 25% of Pension Supp
  craComponent: number;       // 100% of CRA
  totalFortnightly: number;
  totalMonthly: number;       // Approx: fortnightly × 26 / 12
  totalAnnual: number;        // fortnightly × 26
}
