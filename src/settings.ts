import { App, ButtonComponent, Notice, Platform, PluginSettingTab, Setting, normalizePath } from "obsidian";

import { DEFAULT, CollabpageData, Kind, Mode, View } from "./collabpage";
import CollabpagePlugin from "./main";

type CollabpageKey = keyof CollabpageData;
type CollabpageObject = { [key: string]: CollabpageObject}
type Callback<T> = (v: T) => void;

export interface CollabSettings {
    version: number,
    collabpage: CollabpageObject,
    separateMobile: boolean
}

export const DEFAULT_SETTINGS: CollabSettings = {
	version: 3,
	collabpage: {
        [DEFAULT]: {
            value: "",
            kind: Kind.File,
            view: View.Default,
            refreshDataview: false,
            autoCreate: false,
            pin: false,
            commands: [],
            alwaysApply: false,
            hideReleaseNotes: false

        }
    },
    separateMobile: false
}

export const DEFAULT_DATA: CollabpageData = DEFAULT_SETTINGS.collabpage[DEFAULT];
const UNCHANGEABLE: Kind[] = [Kind.Random, Kind.Graph, Kind.None];

export class CollabpageSettingsTab extends PluginSettingTab {
    plugin: CollabpagePlugin;
	settings: CollabSettings;
	elements: Record<string, Setting>;

    commandBox: HTMLElement;

    constructor(app: App, plugin: CollabpagePlugin) {
        super(app, plugin);
        this.plugin = plugin;
        this.settings = plugin.settings;
    }

    display(): void {

    }
}
