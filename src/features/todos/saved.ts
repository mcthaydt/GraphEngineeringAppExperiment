import type { Todo } from './list';
import { parseList, serializeList, STORAGE_KEY } from './library/storage-format';

export type Storage = Pick<globalThis.Storage, 'getItem' | 'setItem'>;
export type LoadProblem = 'unavailable' | 'unreadable' | null;

export function loadList(storage: Storage | null): { list: Todo[]; problem: LoadProblem } {
	if (!storage) return { list: [], problem: 'unavailable' };
	try {
		const raw = storage.getItem(STORAGE_KEY);
		if (raw === null) return { list: [], problem: null };
		const list = parseList(raw);
		if (list) return { list, problem: null };
		// Keep the unreadable copy so the next save does not destroy it.
		storage.setItem(`${STORAGE_KEY}.unreadable`, raw);
		return { list: [], problem: 'unreadable' };
	} catch {
		return { list: [], problem: 'unavailable' };
	}
}

export function saveList(storage: Storage | null, list: Todo[]): boolean {
	if (!storage) return false;
	try {
		storage.setItem(STORAGE_KEY, serializeList(list));
		return true;
	} catch {
		return false;
	}
}

// Some browsers throw just for touching localStorage (blocked site data).
export function browserStorage(): Storage | null {
	try {
		return window.localStorage;
	} catch {
		return null;
	}
}
