import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { describe, expect, it } from 'vitest';

// Lowest layer first. A file may import only from its own layer or one listed before it.
const LAYERS = ['lib', 'features/todos', 'index', 'routes'];

const root = resolve(import.meta.dirname, '..');
const src = join(root, 'src');
const SOURCE = /\.(ts|svelte)$/;

function walk(dir: string): string[] {
	return readdirSync(dir).flatMap((name) => {
		const full = join(dir, name);
		return statSync(full).isDirectory() ? walk(full) : [full];
	});
}

const posix = (path: string) => path.split(sep).join('/');

function layerOf(file: string): number {
	const rel = posix(relative(src, file)).replace(SOURCE, '');
	return LAYERS.findIndex((layer) => rel === layer || rel.startsWith(`${layer}/`));
}

function specifiers(code: string): string[] {
	const found = code.matchAll(/(?:import|export)\s[^'"]*?from\s*['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)|import\s+['"]([^'"]+)['"]/g);
	return [...found].map((m) => m[1] ?? m[2] ?? m[3]);
}

function resolveImport(from: string, spec: string): string | null {
	let base: string;
	if (spec.startsWith('.')) base = resolve(dirname(from), spec);
	else if (/^(\$lib|#lib)(\/|$)/.test(spec)) base = join(src, 'lib', spec.replace(/^(\$lib|#lib)\/?/, ''));
	else return null; // packages and SvelteKit's own modules sit outside the layers
	const candidates = [base, `${base}.ts`, `${base}.svelte`, join(base, 'index.ts')];
	return candidates.find((c) => existsSync(c) && statSync(c).isFile()) ?? null;
}

const files = walk(src).filter((f) => SOURCE.test(f) && !f.endsWith('.d.ts'));
const graph = new Map(
	files.map((file) => [
		file,
		specifiers(readFileSync(file, 'utf8'))
			.map((spec) => resolveImport(file, spec))
			.filter((target): target is string => target !== null && SOURCE.test(target))
	])
);

describe('architecture', () => {
	it('puts every source file in a listed layer', () => {
		const unlisted = files.filter((f) => layerOf(f) === -1).map((f) => posix(relative(root, f)));
		expect(unlisted).toEqual([]);
	});

	it('only imports downward', () => {
		const upward: string[] = [];
		for (const [file, targets] of graph) {
			for (const target of targets) {
				if (layerOf(target) > layerOf(file)) {
					upward.push(`${posix(relative(root, file))} -> ${posix(relative(root, target))}`);
				}
			}
		}
		expect(upward).toEqual([]);
	});

	it('has no import cycles', () => {
		const cycles: string[] = [];
		const done = new Set<string>();
		const visit = (file: string, path: string[]) => {
			if (path.includes(file)) {
				cycles.push([...path.slice(path.indexOf(file)), file].map((f) => posix(relative(root, f))).join(' -> '));
				return;
			}
			if (done.has(file)) return;
			for (const target of graph.get(file) ?? []) visit(target, [...path, file]);
			done.add(file);
		};
		for (const file of graph.keys()) visit(file, []);
		expect(cycles).toEqual([]);
	});

	it('keeps tests in a tree that mirrors src', () => {
		const tests = join(root, 'tests');
		const orphans = walk(tests)
			.filter((f) => /\.(test|e2e)\.ts$/.test(f) && !f.endsWith('architecture.test.ts'))
			.map((f) => posix(relative(tests, f)).replace(/\.(test|e2e)\.ts$/, ''))
			.filter((stem) => {
				const dir = posix(dirname(stem));
				const name = stem.split('/').pop();
				// SvelteKit route files carry a "+" prefix that test names leave off.
				const candidates = [`${stem}.ts`, `${stem}.svelte`, stem, `${dir}/+${name}.svelte`, `${dir}/+${name}.ts`];
				return !candidates.some((c) => existsSync(join(src, c)));
			});
		expect(orphans).toEqual([]);
	});
});
