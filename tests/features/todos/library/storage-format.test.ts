import { describe, expect, it } from 'vitest';
import { parseList, serializeList, STORAGE_KEY } from '../../../../src/features/todos/library/storage-format';

describe('storage format', () => {
	it('uses a versioned key', () => {
		expect(STORAGE_KEY).toBe('todo-app.list.v1');
	});

	it('round-trips a list', () => {
		const list = [{ id: 'a', text: 'Buy milk', done: true }];
		expect(parseList(serializeList(list))).toEqual(list);
	});

	it('rejects anything that is not a list of todos', () => {
		for (const raw of ['not json', '{}', '[1]', '[{"id":"a","text":"x"}]', '[{"id":1,"text":"x","done":false}]']) {
			expect(parseList(raw)).toBeNull();
		}
	});
});
