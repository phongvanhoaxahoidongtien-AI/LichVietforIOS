import { KEYS, loadJSON, saveJSON, isObject } from './storage';

/** Người trong nhà (chỉ lưu trên máy). */
export interface Member { id: string; name: string; birthYear: number; gender?: 'nam' | 'nu' }

const isMembers = (v: unknown): v is Member[] => Array.isArray(v) && v.every((m) => isObject(m) && typeof m.id === 'string' && typeof m.name === 'string' && typeof m.birthYear === 'number' && m.birthYear >= 1900 && m.birthYear <= 2100);

export const loadFamily = (): Member[] => loadJSON<Member[]>(KEYS.family, [], isMembers).slice(0, 30);
export const saveFamily = (list: Member[]) => saveJSON(KEYS.family, list.slice(0, 30).map((m) => ({ ...m, name: m.name.trim().slice(0, 30) || 'Người nhà' })));
export const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export const YEAR_MIN = 1930;
export const YEAR_MAX = 2015;
