import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { DEFAULT, MOBILE, Collabpage, Kind} from './collabpage'
import { DEFAULT_SETTINGS, CollabSettings, CollabpageSettingsTab } from "./settings";

declare const DEV: boolean;
if (DEV) import("./dev");

export default class CollabpagePlugin extends Plugin {
    settings: CollabSettings;
    internalPlugins: Record<string, any>;
    communityPlugins: Record<string, any>;

    loaded: boolean = false;
    executing: boolean = false;

    collabpage: Collabpage;

    async onload(): Promise<void> {
        await this.loadSettings();
        // const appStartup = document.querySelector('#collab')

    }

    async loadSettings(): Promise<void> {


        this.settings = Object.assign({}, DEFAULT_SETTINGS, set)
    }

}