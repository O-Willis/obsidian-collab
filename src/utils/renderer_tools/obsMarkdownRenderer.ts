// import {Component, Notice, WorkspaceLeaf, MarkdownRenderer, MarkdownPreviewView, loadMermaid, TFile} from "obsidian";
// import {Utils} from "../utils";
//
// export namespace obsMarkdownRenderer {
// 	export var convertableExtensions = ["md", "canvas"];
// 	export let renderLeaf: WorkspaceLeaf | undefined;
// 	export let cancelled: boolean = false;
// 	export let batchStarted: boolean = false;
// 	export let errorInBatch: boolean = false;
//
// 	export function checkCancelled(): boolean {
// 		if (obsMarkdownRenderer.cancelled || !obsMarkdownRenderer.renderLeaf) {
// 			console.log('cancelled');
// 			endBatch();
// 			return true;
// 		}
// 		return false;
// 	}
//
// 	function failRender(file: TFile, message: any): undefined {
// 		if (checkCancelled()) return undefined;
// 		console.log(`Rendering ${file.path} failed: `, message);
// 		return;
// 	}
//
// 	export async function renderFile(file: TFile, container: HTMLElement): Promise<{contentEl: HTMLElement, viewType: string} | undefined> {
//
// 		let success = await Utils.waitUntil(() => renderLeaf != undefined || checkCancelled(), 2000, 10);
// 		if (!success || !renderLeaf) return failRender(file, "Failed to get leaf for rendering!");
//
// 		let html: HTMLElement | undefined;
// 		let view = renderLeaf.view;
// 		let viewType = view.getViewType();
//
// 		switch(viewType) {
// 			case 'markdown':
// 				//@ts-ignore
// 				let preview = view.previewMode;
// 				html = await renderMarkdownView(preview, container);
// 				break;
// 			case "kanban":
// 				html = await renderGeneric(view, container);
// 				break;
// 			case "excalidraw":
// 				html = await renderExcalidraw(view, container);
// 				break;
// 			case "canvas":
// 				html = await renderCanvas(view, container);
// 				break;
// 			default:
// 				html = await renderGeneric(view, container);
// 				break;
// 		}
//
// 		if (checkCancelled()) return undefined;
// 		if (!html) return failRender(file, "Failed to render file!");
//
// 		// await postProcessHTML(html);
// 		// await AssetHandler.loadMathjaxStyles();
// 		//
// 		// if (loneFile) MarkdownRenderer.endBatch();
//
// 		return {contentEl: html, viewType: viewType};
// 	}
//
// 	export async function beginBatch() {
// 		if(batchStarted) {
//
// 		}
// 	}
//
// 	export function endBatch() {
//
// 	}
// }
