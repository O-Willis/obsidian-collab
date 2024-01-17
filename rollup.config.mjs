import json from "@rollup/plugin-json";
import nodeResolve from "@rollup/plugin-node-resolve";
import cjs from '@rollup/plugin-commonjs';
import copy from 'rollup-plugin-copy';
import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';

const name = 'collab';

const developmentConfig = {
	input: 'src/main.ts',
	external: ['obsidian'],
	output: {
		dir: 'test-vault/.obsidian/plugins/collab',
		sourcemap: false,
		format: 'cjs',
		exports: 'default',
		name,
	},
	plugins: [
		json(),
		nodeResolve({ preferBuiltins: true }),
		cjs({ include: 'node_modules/**' }),
		typescript({ tsconfig: './tsconfig.dev.json' }),
		copy({
			targets: [
				{
					src: 'styles.css',
					dest: 'test-vault/.obsidian/plugins/collab/',
				},
				{
					src: 'manifest.json',
					dest: 'test-vault/.obsidian/plugins/collab/',
				},
			],
		}),
	],
};

const productionConfig = {
	input: 'src/main.ts',
	external: ['obsidian'],
	output: {
		dir: 'dist',
		sourcemap: false,
		sourcemapExcludeSources: true,
		format: 'cjs',
		exports: 'default',
		name,
	},
	plugins: [
		json(),
		nodeResolve({ preferBuiltins: true }),
		cjs({ include: 'node_modules/**' }),
		typescript({ tsconfig: './tsconfig.dev.json' }),
		copy({
			targets: [
				{
					src: 'styles.css',
					dest: 'dist/',
				},
				{
					src: 'manifest.json',
					dest: 'dist/',
				},
			]
		}),
		terser({ compress: true, mangle: true }),
	],
};

const config =
	process.env.PRODUCTION === '1' ? productionConfig : developmentConfig;
export default config;
