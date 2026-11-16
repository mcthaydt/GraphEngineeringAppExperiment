import type { Todo } from '../list';

// Changing this key or the shape below once shipped can lose people's saved lists (lane 3).
export const STORAGE_KEY = 'todo-app.list.v1';

export const serializeList = (list: Todo[]) => JSON.stringify(list);

const isTodo = (value: unknown): value is Todo =>
	typeof value === 'object' &&
	value !== null &&
	typeof (value as Todo).id === 'string' &&
	typeof (value as Todo).text === 'string' &&
	typeof (value as Todo).done === 'boolean';

export function parseList(raw: string): Todo[] | null {
	try {
		const value: unknown = JSON.parse(raw);
		return Array.isArray(value) && value.every(isTodo) ? value : null;
	} catch {
		return null;
	}
}
