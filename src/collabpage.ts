// import { App, FileView, MarkdownView, Notice, View as OView, WorkspaceLeaf, moment } from "obsidian";
// import CollabPlugin from "./main";
//
// export const LEAF_TYPES: string[] = ["markdown", "canvas", "kanban"];
//
// export const DEFAULT: string = "Main Collabpage";
// export const MOBILE: string = "Mobile Collabpage";
//
// export interface CollabpageData {
//     [member: string]: any,
//     value: string,
//     kind: string,
//     view: string,
//     refreshDataview: boolean,
// 	autoCreate: boolean,
//     pin: boolean,
// 	commands: string[],
// 	alwaysApply: boolean,
// 	hideReleaseNotes: boolean
// }
//
// export enum Mode {
//     ReplaceAll = "Replace all open notes",
// 	ReplaceLast = "Replace last note",
// 	Retain = "Keep open notes"
// }
//
// export enum View {
// 	Default = "Default view",
// 	Reading = "Reading view",
// 	Source = "Editing view (Source)",
// 	LivePreview = "Editing view (Live Preview)"
// }
//
// export enum Kind {
//     File = "File",
//     Workspace = "Workspace",
//     Random = "Random file",
//     Graph = "Graph view",
//     None = "Nothing",
//     DailyNote = "Daily Note",
//     WeeklyNote = "Weekly Note",
//     MonthlyNote = "Monthly Note",
//     YearlyNote = "Yearly Note",
// }
//
// export class Collabpage {
//     plugin: CollabPlugin;
//     app: App;
//     data: CollabpageData;
//     name: string;
// }
