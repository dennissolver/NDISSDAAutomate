import { BuildingType } from '../types/pricing.types';

export const BUILDING_TYPE_INFO: Record<BuildingType, {
  label: string;
  maxResidents: number;
}> = {
  [BuildingType.HOUSE_2_RESIDENTS]: { label: 'House, 2 residents', maxResidents: 2 },
  [BuildingType.HOUSE_3_RESIDENTS]: { label: 'House, 3 residents', maxResidents: 3 },
  [BuildingType.VILLA_1_RESIDENT]: { label: 'Villa/Duplex/Townhouse, 1 resident', maxResidents: 1 },
  [BuildingType.VILLA_2_RESIDENTS]: { label: 'Villa/Duplex/Townhouse, 2 residents', maxResidents: 2 },
};
