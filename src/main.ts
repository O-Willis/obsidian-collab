import {App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, TFile} from 'obsidian';
// import { DEFAULT, MOBILE, Collabpage, Kind} from './collabpage'
import { DEFAULT_SETTINGS, CollabSettings } from "./settings/settings";
import { CollabSettingsTab } from "./settings/settingsTab";
import { ServerController } from "./server/controller";
import { setupUiButton } from "./objects/uiServerButton";
import {ServerRunningModal} from "./objects/modals";

export default class CollabPlugin extends Plugin {
    public settings!: CollabSettings;
    serverController?: ServerController;
	private uiCleanupFns?: { clearRibbonButton: () => void, clearModal: () => void };

	ReloadUiElements() {
		this.uiCleanupFns?.clearRibbonButton();
		this.uiCleanupFns?.clearModal();
		this.uiCleanupFns = setupUiButton(this);
	}

    async onload() {
        await this.loadSettings();
        // const appStartup = document.querySelector('#collab')

    }

	async onunload() {
		await this.stopServer();
	}

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());

		this.registerExtensions(['html', 'htm'], "markdown");

		this.app.workspace.onLayoutReady(async () => {
			this.uiCleanupFns = setupUiButton(this);
			this.addSettingTab(new CollabSettingsTab(this.app, this));
			await this.handleSettings();
			this.serverController = new ServerController(this);

			// console.log(this.settings.authorizedUsers);

			if (this.settings.startOnLoad) {
				await this.startServer();
			} else {
				this.app.workspace.trigger('collab-event', {
					isServerRunning: false,
				});
			}
			this.addCommand({
				id: 'start-server',
				name: 'Start the Web Server',
				checkCallback: (checking) => {
					if (checking) {
						return !this.serverController?.isRunning();
					}
					this.startServer();
				},
			});

			this.addCommand({
				id: 'stop-server',
				name: 'Stop the Web Server',
				checkCallback: (checking) => {
					if (checking) {
						return !!this.serverController?.isRunning();
					}
					this.stopServer();
				},
			});
		});
    }

	async saveSettings() {
		await this.saveData(this.settings);
		await this.serverController?.reload();
	}

	async startServer() {
		await this.serverController?.start();
		if (this.serverController?.isRunning()) {
			this.app.workspace.trigger('collab-event', {
				isServerRunning: true,
			});
		}
		return !!this.serverController?.isRunning();
	}

	async stopServer() {
		await this.serverController?.stop();
		this.app.workspace.trigger('collab-event', { isServerRunning: false });
		return !this.serverController?.isRunning();
	}

	async setReccentFile(file: TFile) {
		this.settings.recentFile = file;
	}

	handleSettings() {
		console.log(document.scripts?.item(0)?.style);
		// Code to change the display of all data-path elements that are considered '.html' files
		// const html_files = document.querySelectorAll('div[data-path$=".html"]');
		// html_files.forEach((divElement) => {
		// 	const existingStyles = divElement.getAttribute('style') || '';
		// 	const existingStylesObject: Record<string, string> = {};
		// 	existingStyles.split(';').forEach((style) => {
		// 		const [property, value] = style.split(':').map((s) => s.trim());
		// 		if (property && value) {
		// 			existingStylesObject[property] = value;
		// 		}
		// 	});
		// 	existingStylesObject['display'] = `${this.settings.enableHtmlView ? 'flex' : 'none'}`;
		// 	const mergedStyles = Object.entries(existingStylesObject)
		// 		.map(([property, value]) => `${property}: ${value};`).join(' ');
		// 	divElement.setAttribute('style', mergedStyles);
		// });
	}
}
