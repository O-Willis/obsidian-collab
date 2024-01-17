import { CollabSettings} from "../settings/settings";
import { EventRef } from "obsidian";
export { App, PluginSettingTab, Setting, Plugin} from 'obsidian';

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
}
