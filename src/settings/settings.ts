import {AddressInfo} from "net";
import {randomBytes} from "crypto";
import {TFile} from "obsidian";

export type ReplaceableVariables = { varName: string; varValue: string };

export enum Auth {
	None = 'None',
	Simple = 'Simple',
	Complex = 'Complex'
}

export type UserCredentials = { username: string, password: string, IP: AddressInfo | string | null }
export interface CollabSettings {
	// General Settings
    version: number,
    separateMobile: boolean,
	recentFile?: TFile,

	// Format Optionals
	collapsableNavBar: boolean;
	customLineWidth: string;
	contentWidth: string;
	sidebarWidth: string;
	startCollapsedOutline: string;

	// Page Optionals
	toggleDarkMode: boolean;
	faviconLink: string;
	toggleDocumentOutline: boolean;
	toggleNavTree: boolean;

	// Server Optionals
	port: number;
	startupFile: string;
	hostname: string;
	startOnLoad: boolean;
	useRibbonButtons: boolean;
	indexHtml: string;
	useAuthentication: Auth,
	useIP: boolean,
	authorizedUsers: UserCredentials[];
}

export const DEFAULT_SETTINGS: CollabSettings = {
	// General Settings
	version: 1,
    separateMobile: false,
	recentFile: undefined,

	// Format Optionals
	collapsableNavBar: true,
	customLineWidth: "",
	contentWidth: "",
	sidebarWidth: "",
	startCollapsedOutline: "",

	// Page Optionals
	toggleDarkMode: false,
	faviconLink: 'https://obsidian.md/favicon.ico',
	toggleDocumentOutline: false,
	toggleNavTree: true,

	// Server Optionals
	port: 8080,
	hostname: '0.0.0.0',
	startupFile: '',
	startOnLoad: false,
	useRibbonButtons: true,
	indexHtml: ``,
	useAuthentication: Auth.None,
	useIP: false,  // Shall only be used if useAuthentication is used
	authorizedUsers: [
		{
			username: 'username',
			password: randomBytes(8).toString('hex'),
			IP: {address: '', family: '', port: -1}
		},
		{
			username: 'guest',
			password: randomBytes(8).toString('hex'),
			IP: {address: '', family: '', port: -1}
		}
	]
}
