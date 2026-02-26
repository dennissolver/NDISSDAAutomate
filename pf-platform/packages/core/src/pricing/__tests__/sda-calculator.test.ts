import { describe, it, expect } from 'vitest';
import { calculateSdaPricing } from '../sda-calculator';
import { BuildingType, DesignCategory } from '@pf/shared';

describe('SDA Pricing Calculator', () => {
  it('should calculate annual SDA for a standard Townsville property', () => {
    const result = calculateSdaPricing({
      buildingType: BuildingType.HOUSE_2_RESIDENTS,
      designCategory: DesignCategory.FULLY_ACCESSIBLE,
      locationFactor: 1.08,
      hasOoa: false,
      hasBreakoutRoom: false,
      hasFireSprinklers: false,
    });

    expect(result.baseAnnualRate).toBe(41400);
    expect(result.locationFactor).toBe(1.08);
    expect(result.annualSdaAmount).toBeCloseTo(41400 * 1.08, 0);
    expect(result.monthlySdaAmount).toBeCloseTo((41400 * 1.08) / 12, 0);
  });

  it('should add OOA supplement when enabled', () => {
    const withOoa = calculateSdaPricing({
      buildingType: BuildingType.HOUSE_2_RESIDENTS,
      designCategory: DesignCategory.FULLY_ACCESSIBLE,
      locationFactor: 1.0,
      hasOoa: true,
      hasBreakoutRoom: false,
      hasFireSprinklers: false,
    });

    const withoutOoa = calculateSdaPricing({
      buildingType: BuildingType.HOUSE_2_RESIDENTS,
      designCategory: DesignCategory.FULLY_ACCESSIBLE,
      locationFactor: 1.0,
      hasOoa: false,
      hasBreakoutRoom: false,
      hasFireSprinklers: false,
    });

    expect(withOoa.annualSdaAmount).toBeGreaterThan(withoutOoa.annualSdaAmount);
    expect(withOoa.ooaSupplement).toBe(11600);
  });

  it('should only allow breakout room for Robust category', () => {
    const robust = calculateSdaPricing({
      buildingType: BuildingType.HOUSE_2_RESIDENTS,
      designCategory: DesignCategory.ROBUST,
      locationFactor: 1.0,
      hasOoa: false,
      hasBreakoutRoom: true,
      hasFireSprinklers: false,
    });

    const nonRobust = calculateSdaPricing({
      buildingType: BuildingType.HOUSE_2_RESIDENTS,
      designCategory: DesignCategory.FULLY_ACCESSIBLE,
      locationFactor: 1.0,
      hasOoa: false,
      hasBreakoutRoom: true, // Should be ignored
      hasFireSprinklers: false,
    });

    expect(robust.breakoutSupplement).toBe(3680);
    expect(nonRobust.breakoutSupplement).toBe(0);
  });

  it('should throw for invalid building type + design category combo', () => {
    expect(() =>
      calculateSdaPricing({
        buildingType: BuildingType.HOUSE_2_RESIDENTS,
        designCategory: DesignCategory.BASIC,
        locationFactor: 1.0,
        hasOoa: false,
        hasBreakoutRoom: false,
        hasFireSprinklers: false,
      }),
    ).toThrow();
  });
});
