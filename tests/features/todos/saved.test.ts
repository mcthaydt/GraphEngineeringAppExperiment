import { describe, expect, it } from 'vitest';
import { loadList, saveList } from '../../../src/features/todos/saved';
import { STORAGE_KEY } from '../../../src/features/todos/library/storage-format';

class MemoryStorage {
	data = new Map<string, string>();
	failWrites = false;
	getItem(key: string) {
		return this.data.get(key) ?? null;
	}
	setItem(key: string, value: string) {
		if (this.failWrites) throw new Error('QuotaExceededError');
		this.data.set(key, value);
	}
}

describe('loadList', () => {
	it('starts empty when nothing is saved', () => {
		expect(loadList(new MemoryStorage())).toEqual({ list: [], problem: null });
	});

	it('reads what saveList wrote', () => {
		const storage = new MemoryStorage();
		const list = [{ id: 'a', text: 'A', done: false }];
		expect(saveList(storage, list)).toBe(true);
		expect(loadList(storage)).toEqual({ list, problem: null });
	});

	it('keeps an unreadable list aside instead of losing it', () => {
		const storage = new MemoryStorage();
		storage.data.set(STORAGE_KEY, 'garbage');
		expect(loadList(storage)).toEqual({ list: [], problem: 'unreadable' });
		expect(storage.data.get(`${STORAGE_KEY}.unreadable`)).toBe('garbage');
	});

	it('reports when there is no storage at all', () => {
		expect(loadList(null)).toEqual({ list: [], problem: 'unavailable' });
	});

	it('reports when reading throws', () => {
		const broken = {
			getItem() {
				throw new Error('SecurityError');
			},
			setItem() {}
		};
		expect(loadList(broken)).toEqual({ list: [], problem: 'unavailable' });
	});
});

describe('saveList', () => {
	it('returns false when the write fails', () => {
		const storage = new MemoryStorage();
		storage.failWrites = true;
		expect(saveList(storage, [])).toBe(false);
	});

	it('returns false with no storage', () => {
		expect(saveList(null, [])).toBe(false);
	});
});
