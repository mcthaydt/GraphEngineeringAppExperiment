import { describe, expect, it } from 'vitest';
import { addTodo, putBack, removeTodo, toggleTodo, type Todo } from '../../../src/features/todos/list';

const ids = () => {
	let n = 0;
	return () => `id-${++n}`;
};

describe('addTodo', () => {
	it('adds trimmed text to the end, not done', () => {
		const newId = ids();
		const first = addTodo([], '  Buy milk ', newId);
		const second = addTodo(first.list, 'Call Mum', newId);
		expect(second).toEqual({
			list: [
				{ id: 'id-1', text: 'Buy milk', done: false },
				{ id: 'id-2', text: 'Call Mum', done: false }
			],
			error: null
		});
	});

	it('refuses blank text and leaves the list alone', () => {
		const list: Todo[] = [{ id: 'a', text: 'x', done: false }];
		expect(addTodo(list, '   ', ids())).toEqual({ list, error: 'empty' });
	});
});

describe('toggleTodo', () => {
	it('flips only the matching todo', () => {
		const list: Todo[] = [
			{ id: 'a', text: 'A', done: false },
			{ id: 'b', text: 'B', done: false }
		];
		expect(toggleTodo(list, 'b')).toEqual([
			{ id: 'a', text: 'A', done: false },
			{ id: 'b', text: 'B', done: true }
		]);
		expect(toggleTodo(toggleTodo(list, 'b'), 'b')).toEqual(list);
	});
});

describe('removeTodo and putBack', () => {
	const list: Todo[] = [
		{ id: 'a', text: 'A', done: false },
		{ id: 'b', text: 'B', done: true },
		{ id: 'c', text: 'C', done: false }
	];

	it('removes a todo and remembers where it was', () => {
		const result = removeTodo(list, 'b');
		expect(result.list.map((t) => t.id)).toEqual(['a', 'c']);
		expect(result.removed).toEqual({ todo: list[1], index: 1 });
	});

	it('puts a removed todo back in its old place', () => {
		const { list: after, removed } = removeTodo(list, 'b');
		expect(putBack(after, removed!)).toEqual(list);
	});

	it('does nothing for an unknown id', () => {
		expect(removeTodo(list, 'zzz')).toEqual({ list, removed: null });
	});
});
