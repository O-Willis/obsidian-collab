import json from "@rollup/plugin-json";
import nodeResolve from "@rollup/plugin-node-resolve";
import cjs from '@rollup/plugin-commonjs';
import copy from 'rollup-plugin-copy';
import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';

const name = 'collab';

const sharedPlugins = [
	json(),
	nodeResolve({ preferBuiltins: true }),
	cjs({ include: 'node_modules/**' }),
];

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
		...sharedPlugins,
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
		...sharedPlugins,
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

// const editorConfig = {
// 	input: "./editor.mjs",
// 	output: {
// 		file: "src/editor.bundle.js",
// 		sourcemap: false,
// 		format: "iife",
// 		name,
// 	},
// 	plugins: [
// 		cjs({ include: 'node_modules/**' }),
// 		nodeResolve({ preferBuiltins: true }),
// 	]
// }

const config = process.env.PRODUCTION === '1' ? productionConfig : developmentConfig;
// export default [config, editorConfig];
export default config;
