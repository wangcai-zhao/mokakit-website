/**
 * 生活实用工具纯函数层（pet-age / coffee-ratio）。
 * 全部纯函数、无浏览器 API，前端与未来 MCP 可共用同一份。
 */
import { type ToolResult, ok, err } from './tool-result';

export type PetSpecies = 'dog' | 'cat';

export function petAge(species: PetSpecies, age: number): ToolResult<{
  humanYears: number; stage: string;
}> {
  if (age <= 0 || !Number.isFinite(age)) return err('宠物年龄须为正数');
  let human: number;
  if (age <= 1) human = 15;
  else if (age === 2) human = 24;
  else human = species === 'dog' ? 24 + (age - 2) * 5 : 24 + (age - 2) * 4;
  let stage: string;
  if (age < 2) stage = species === 'dog' ? '幼犬' : '幼猫';
  else if (age <= 7) stage = '成年';
  else stage = species === 'dog' ? '老年犬' : '老年猫';
  return ok({ humanYears: human, stage });
}

export function coffeeRatio(doseGrams: number, ratio: number): ToolResult<{
  waterMl: number; ratio: number;
}> {
  if (doseGrams <= 0) return err('咖啡粉重量须为正数');
  if (ratio <= 0) return err('粉水比例须为正数');
  return ok({ waterMl: Math.round(doseGrams * ratio), ratio });
}

export function coffeeByWater(doseGrams: number, waterMl: number): ToolResult<{
  waterMl: number; ratio: number;
}> {
  if (doseGrams <= 0) return err('咖啡粉重量须为正数');
  if (waterMl <= 0) return err('水量须为正数');
  return ok({ waterMl: Math.round(waterMl), ratio: +(waterMl / doseGrams).toFixed(2) });
}
