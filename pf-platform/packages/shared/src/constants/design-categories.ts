import { DesignCategory } from '../types/pricing.types';

/**
 * Design category metadata and validation rules.
 */
export const DESIGN_CATEGORY_INFO: Record<DesignCategory, {
  label: string;
  description: string;
  breakoutRoomAllowed: boolean;
}> = {
  [DesignCategory.BASIC]: {
    label: 'Basic',
    description: 'Housing without specialist design features but with room for carer',
    breakoutRoomAllowed: false,
  },
  [DesignCategory.IMPROVED_LIVEABILITY]: {
    label: 'Improved Liveability',
    description: 'Reasonable level of physical access and enhanced provision for sensory, intellectual or cognitive impairment',
    breakoutRoomAllowed: false,
  },
  [DesignCategory.FULLY_ACCESSIBLE]: {
    label: 'Fully Accessible',
    description: 'High level of physical access features for significant physical impairment',
    breakoutRoomAllowed: false,
  },
  [DesignCategory.ROBUST]: {
    label: 'Robust',
    description: 'Resilient design with high physical access provisions using durable materials',
    breakoutRoomAllowed: true, // Only category where breakout room is allowed
  },
  [DesignCategory.HIGH_PHYSICAL_SUPPORT]: {
    label: 'High Physical Support',
    description: 'Enhanced physical access for significant physical impairment with very high support needs',
    breakoutRoomAllowed: false,
  },
};
