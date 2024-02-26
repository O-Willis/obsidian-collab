import { CollabSettings} from "../settings/settings";
import {EventRef } from "obsidian";
export { App, PluginSettingTab, Setting, MarkdownPreviewRenderer, MarkdownView, WorkspaceLeaf, Plugin} from 'obsidian';

declare module 'obsidian' {
	interface App {
		plugins: {
			disablePlugin: (id: string) => Promise<void>;
			enablePlugin: (id: string) => Promise<void>;
		}
	}

	interface Workspace {
		on (
			name: 'collab-event',
			callback: (data: { isServerRunning: boolean }) => void
		): EventRef;
		on(
			name: 'collab-settings-change',
			callback: (settings: PluginSettingTab) => void
		): EventRef;
	}

	interface WorkspaceItem {
		containerEl: Element;
	}

	type MarkdownViewModeTypes = 'source' | 'preview' | 'edit';

	interface MarkdownSubView {
		type: MarkdownViewModeTypes;
		renderer: MarkdownPreviewRenderer;
		onRenderComplete: () => void;
	}

	interface MarkdownPreviewRenderer {
		queued?: { high: boolean; cancel: () => void };
		previewEl: Element;
		queueRender: () => void;
		set: (markdown: string) => void;
		rendered?: unknown[];
		parsing: boolean;
		onRender: () => void;
		__proto__: MarkdownPreviewRenderer;
	}

	// Hypothetical interfaces for other renderer types, assuming specific methods/properties for demonstration
	// interface MarkdownSourceRenderer {
	// 	// Specific properties or methods for source view renderer
	// 	queued?: { high: boolean; cancel: () => void };
	// 	previewEl: Element;
	// 	queueRender: () => void;
	// 	set: (markdown: string) => void;
	// 	rendered?: unknown[];
	// 	parsing: boolean;
	// 	onRender: () => void;
	// 	__proto__: MarkdownSourceRenderer;
	// }

	// interface MarkdownEditRenderer {
	// 	// Specific properties or methods for edit view renderer
	// 	queued?: { high: boolean; cancel: () => void };
	// 	previewEl: Element;
	// 	queueRender: () => void;
	// 	set: (markdown: string) => void;
	// 	rendered?: unknown[];
	// 	parsing: boolean;
	// 	onRender: () => void;
	// 	__proto__: MarkdownEditRenderer;
	// }
}
