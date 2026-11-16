<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { addTodo, putBack, removeTodo, toggleTodo, type Removed, type Todo } from './list';
	import { browserStorage, loadList, saveList, type LoadProblem, type Storage } from './saved';

	let {
		storage = undefined,
		newId = () => crypto.randomUUID()
	}: { storage?: Storage | null; newId?: () => string } = $props();

	let list = $state<Todo[]>([]);
	let text = $state('');
	let ready = $state(false);
	let readyMs = $state<number | null>(null);
	let blank = $state(false);
	let loadProblem = $state<LoadProblem>(null);
	let saveFailed = $state(false);
	let removed = $state<Removed | null>(null);
	let store: Storage | null = null;
	let input = $state<HTMLInputElement>();
	let putBackButton = $state<HTMLButtonElement>();

	onMount(() => {
		store = storage === undefined ? browserStorage() : storage;
		const loaded = loadList(store);
		list = loaded.list;
		loadProblem = loaded.problem;
		ready = true;
		readyMs = Math.round(performance.now());
	});

	function commit(next: Todo[]) {
		list = next;
		saveFailed = !saveList(store, next);
	}

	function add(event: SubmitEvent) {
		event.preventDefault();
		const result = addTodo(list, text, newId);
		blank = result.error === 'empty';
		if (!blank) {
			commit(result.list);
			text = '';
		}
		input?.focus();
	}

	async function remove(id: string) {
		const result = removeTodo(list, id);
		if (!result.removed) return;
		removed = result.removed;
		commit(result.list);
		await tick();
		// The removed row's button is gone; keep keyboard users on the way back.
		putBackButton?.focus();
	}

	function undo() {
		if (!removed) return;
		commit(putBack(list, removed));
		removed = null;
		input?.focus();
	}
</script>

<main data-ready={ready} data-ready-ms={readyMs}>
	<h1>My to-do list</h1>

	<form onsubmit={add}>
		<label for="new-todo">What do you need to do?</label>
		<div class="row">
			<input
				id="new-todo"
				bind:this={input}
				bind:value={text}
				oninput={() => (blank = false)}
				autocomplete="off"
				aria-describedby={blank ? 'blank-note' : undefined}
				aria-invalid={blank}
			/>
			<button type="submit" class="primary">Add</button>
		</div>
		{#if blank}
			<p id="blank-note" class="note" role="alert">Type something first, then press Add.</p>
		{/if}
	</form>

	{#if loadProblem === 'unavailable' || saveFailed}
		<p class="warning" role="alert">
			This browser won't let us save your list. It will be gone when you close this page.
		</p>
	{:else if loadProblem === 'unreadable'}
		<p class="warning" role="alert">
			We couldn't read your old list, so you're starting a fresh one. The old one is kept safe on this
			device.
		</p>
	{/if}

	{#if removed}
		<div class="removed" role="status">
			<span>Removed “{removed.todo.text}”.</span>
			<button type="button" bind:this={putBackButton} onclick={undo}>Put it back</button>
		</div>
	{/if}

	{#if !ready}
		<p class="quiet">Getting your list…</p>
	{:else if list.length === 0}
		<p class="quiet">Nothing on your list yet. Type something above and press Add.</p>
	{:else}
		<ul>
			{#each list as todo (todo.id)}
				<li class:done={todo.done}>
					<label class="item">
						<input type="checkbox" checked={todo.done} onchange={() => commit(toggleTodo(list, todo.id))} />
						<span>{todo.text}</span>
					</label>
					<button type="button" class="remove" aria-label="Remove {todo.text}" onclick={() => remove(todo.id)}>
						Remove
					</button>
				</li>
			{/each}
		</ul>
	{/if}
</main>

<style>
	main {
		--ink: #1a1a1a;
		--paper: #ffffff;
		--line: #8a8a8a;
		--accent: #1f5fbf;
		--accent-ink: #ffffff;
		--soft: #f2f2f2;
		--warn-bg: #fff4d6;
		--warn-line: #b37a00;
		--focus: #e05a00;
		max-width: 40rem;
		margin: 0 auto;
		padding: 1.5rem 1rem 4rem;
		color: var(--ink);
		font-size: 1.25rem;
		line-height: 1.4;
	}

	@media (prefers-color-scheme: dark) {
		main {
			--ink: #f2f2f2;
			--paper: #161616;
			--line: #8a8a8a;
			--accent: #4d8eff;
			--accent-ink: #0b0b0b;
			--soft: #262626;
			--warn-bg: #3a2c00;
			--warn-line: #e0a400;
			--focus: #ffa64d;
		}
	}

	:global(body) {
		margin: 0;
		font-family: system-ui, sans-serif;
		background: #ffffff;
	}

	@media (prefers-color-scheme: dark) {
		:global(body) {
			background: #161616;
		}
	}

	h1 {
		font-size: 2rem;
		margin: 0 0 1.25rem;
	}

	label[for='new-todo'] {
		display: block;
		font-weight: 600;
		margin-bottom: 0.5rem;
	}

	.row {
		display: flex;
		gap: 0.75rem;
	}

	input:not([type='checkbox']) {
		flex: 1;
		min-width: 0;
		min-height: 3.5rem;
		padding: 0 1rem;
		font: inherit;
		color: var(--ink);
		background: var(--paper);
		border: 2px solid var(--line);
		border-radius: 0.75rem;
	}

	button {
		min-height: 3.5rem;
		padding: 0 1.25rem;
		font: inherit;
		font-weight: 600;
		border-radius: 0.75rem;
		border: 2px solid var(--line);
		background: var(--soft);
		color: var(--ink);
		cursor: pointer;
	}

	button.primary {
		min-width: 6rem;
		background: var(--accent);
		border-color: var(--accent);
		color: var(--accent-ink);
	}

	:focus-visible {
		outline: 4px solid var(--focus);
		outline-offset: 3px;
	}

	.note {
		margin: 0.5rem 0 0;
		font-weight: 600;
	}

	.warning {
		margin: 1.25rem 0 0;
		padding: 1rem;
		border: 2px solid var(--warn-line);
		background: var(--warn-bg);
		border-radius: 0.75rem;
	}

	.removed {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 0.75rem;
		margin-top: 1.25rem;
		padding: 0.75rem 1rem;
		background: var(--soft);
		border-radius: 0.75rem;
	}

	.quiet {
		margin-top: 2rem;
		color: var(--ink);
		opacity: 0.8;
	}

	ul {
		list-style: none;
		padding: 0;
		margin: 1.5rem 0 0;
	}

	li {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.5rem 0;
		border-bottom: 1px solid var(--line);
	}

	.item {
		flex: 1;
		display: flex;
		align-items: center;
		gap: 1rem;
		min-height: 3.5rem;
		cursor: pointer;
		overflow-wrap: anywhere;
	}

	input[type='checkbox'] {
		flex: none;
		width: 2rem;
		height: 2rem;
		accent-color: var(--accent);
		cursor: pointer;
	}

	li.done span {
		text-decoration: line-through;
		opacity: 0.6;
	}
</style>
