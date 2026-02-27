import {
  type Property,
  type Occupancy,
  type SdaPricingResult,
} from '@pf/shared';
import { calculateSdaPricing } from '../pricing';

export function calculatePropertySdaAmount(property: Property): SdaPricingResult {
  return calculateSdaPricing({
    buildingType: property.buildingType,
    designCategory: property.designCategory,
    hasOoa: property.hasOoa,
    hasBreakoutRoom: property.hasBreakoutRoom,
    hasFireSprinklers: property.hasFireSprinklers,
    locationFactor: property.locationFactor,
  });
}

export function getPropertyDisplayLabel(property: Property): string {
  return property.propertyLabel ?? `${property.addressLine1}, ${property.suburb}`;
}

export function isPropertyFullyOccupied(occupancies: Occupancy[], maxResidents: number): boolean {
  const activeOccupancies = occupancies.filter(o => !o.endDate);
  return activeOccupancies.length >= maxResidents;
}
