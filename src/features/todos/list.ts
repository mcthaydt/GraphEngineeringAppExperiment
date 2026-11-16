export type Todo = { id: string; text: string; done: boolean };
export type Removed = { todo: Todo; index: number };

export function addTodo(list: Todo[], text: string, newId: () => string) {
	const trimmed = text.trim();
	if (!trimmed) return { list, error: 'empty' as const };
	return { list: [...list, { id: newId(), text: trimmed, done: false }], error: null };
}

export function toggleTodo(list: Todo[], id: string): Todo[] {
	return list.map((todo) => (todo.id === id ? { ...todo, done: !todo.done } : todo));
}

export function removeTodo(list: Todo[], id: string): { list: Todo[]; removed: Removed | null } {
	const index = list.findIndex((todo) => todo.id === id);
	if (index === -1) return { list, removed: null };
	return { list: list.filter((_, i) => i !== index), removed: { todo: list[index], index } };
}

export function putBack(list: Todo[], { todo, index }: Removed): Todo[] {
	return [...list.slice(0, index), todo, ...list.slice(index)];
}
