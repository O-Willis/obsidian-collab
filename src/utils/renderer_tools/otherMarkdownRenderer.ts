// import {App, MarkdownPreviewRenderer, MarkdownView, WorkspaceLeaf} from "../../objects/types";
// import CollabPlugin from "../../main";
// import {CustomMarkdownRenderer} from "./customMarkdownRenderer";
// import {Editor, MarkdownPreviewView, MarkdownSourceView, MarkdownPreviewRenderer, MarkdownRenderer} from "obsidian";
//
// export class ObsidianMarkdownRenderer extends CustomMarkdownRenderer {
// 	rootElement: HTMLDivElement;
//
// 	constructor(private plugin: CollabPlugin, private app: App) {
// 		super();
// 		this.patchObsidianMarkdownRenderer();
// 		this.rootElement = this.getOrCreateRootDomElement();
// 	}
//
// 	private patchObsidianMarkdownRenderer() {
// 		const originalQueueRenderFn = MarkdownPreviewRenderer.prototype.queueRender;
// 		const originalSourceQueueRenderFn = MarkdownSourceRenderer.prototype.queueRender;
//
// 		const alteredQueueRenderFn: typeof originalQueueRenderFn = function (this: MarkdownPreviewRenderer) {
// 			this.rendered || (this.rendered = []);
// 			const e = this.queued;
// 			const t = !this.parsing;
// 			if (e && t && !e.high) {
// 				e.cancel();
// 				const timeOut = setTimeout(this.onRender.bind(this), 0);
// 				this.queued = {
// 					high: true,
// 					cancel: () => clearTimeout(timeOut)
// 				};
// 			} else {
// 				const n = t ? 0 : 200;
// 				const timeOut = setTimeout(this.onRender.bind(this), n);
// 				this.queued = {
// 					high: !n,
// 					cancel: () => clearTimeout(timeOut)
// 				}
// 			}
// 		};
//
// 		MarkdownPreviewRenderer.prototype.queueRender = alteredQueueRenderFn;
//
// 		this.plugin.register(() => {
// 			MarkdownPreviewRenderer.prototype.queueRender = originalQueueRenderFn;
// 		})
// 	}
//
// 	private getOrCreateRootDomElement() {
// 		const maybe = document.querySelector<HTMLDivElement>(`body .html-server-rendering-element`);
// 		if (!maybe) {
// 			const rootEl = document.body.createEl('div');
// 			rootEl.addClass('html-server-rendering-element');
// 			return rootEl;
// 		}
// 		return maybe;
// 	}
//
// 	async renderHtmlFromMarkdown(markdown:string, viewMode: 'edit'|'preview'|'source'): Promise<string> {
// 		//@ts-ignore
// 		const leaf = new WorkspaceLeaf(this.app);
//
// 		const el = this.rootElement.createDiv();
// 		leaf.containerEl = el;
//
// 		let view = new MarkdownView(leaf);
// 		leaf.view = view;
//
// 		let curView;
// 		switch(viewMode) {
// 			case 'edit':
// 				// Create an Editor view
// 				curView = new Editor.prototype.getDoc();
// 				leaf.view = view;
// 				// Set the markdown directly as the editor's value
// 				curView.setValue(markdown);
// 				break;
// 			case 'source':
// 				// Create a Source view (MarkdownSourceView is hypothetical and represents a view that mixes editing and preview)
// 				// @ts-ignore
// 				curView = new MarkdownSourceView(leaf.view);
// 				// Assume MarkdownSourceView has a similar method to set content
// 				curView.setContent(markdown);
// 				break;
// 			case 'preview':
// 			default:
// 				// @ts-ignore
// 				curView = new MarkdownPreviewView(leaf.view);
// 				break;
// 		}
// 		view.currentMode = curView;
// 		view.currentMode.type = viewMode;
//
// 		// if (viewMode === 'preview') {
// 		// 	// @ts-ignore
// 		// 	view.currentMode = new MarkdownPreviewView(leaf.view);
// 		// } else if (viewMode === 'edit') {
// 		// 	// @ts-ignore
// 		// 	view.currentMode = new MarkdownEditView(leaf.view);
// 		// } else if (viewMode === 'source') {
// 		// 	// @ts-ignore
// 		// 	view.currentMode = new MarkdownSourceView(leaf.view);
// 		// } else {
// 		// 	return '';
// 		// }
// 		// view.currentMode.type = viewMode;
//
//
// 		let n = 0;
// 		const renderedPromise = new Promise<string>((resolve, _reject) => {
// 			view.currentMode.onRenderComplete = () => {
// 				if (view.currentMode.renderer.queued) {
// 					return;
// 				}
// 				if (!n++) {
// 					const callouts = view.currentMode.renderer.previewEl.querySelectorAll(`.callout-icon svg`);
// 					callouts.forEach((el) => {
// 						el.parentElement?.removeChild(el);
// 					});
// 					//@ts-ignore
// 					view.currentMode.renderer.sections.forEach((section) => {
// 						const promises: Promise<void>[] = [];
// 						//@ts-ignore
// 						view.currentMode.renderer.owner.postProcess(
// 							section,
// 							promises,
// 							//@ts-ignore
// 							view.currentMode.renderer.frontmatter
// 						);
// 						if (promises.length) {
// 							//@ts-ignore
// 							view.currentMode.renderer.asyncSections.push(section);
// 							Promise.all(promises).then(function () {
// 								//@ts-ignore
// 								view.currentMode.renderer.asyncSections.remove(section),
// 									section.resetCompute(),
// 									view.currentMode.renderer.queueRender();
// 							});
// 						}
// 					});
// 					view.currentMode.renderer.onRender(); // Force a rerender to update everything that needs css (callout-icons, etc?)
// 					return;
// 				}
//
// 				this.postProcess(view.currentMode.renderer.previewEl);
// 				const html = view.currentMode.renderer.previewEl.innerHTML;
//
//
// 				leaf.detach();
// 				this.rootElement.removeChild(el);
//
// 				if (viewMode === 'edit' || viewMode === 'source') {
// 					// For edit and source modes, return the text content directly
// 					return Promise.resolve(curView.getValue()); // Assuming a getValue method exists
// 				} else {
// 					// For preview mode, follow your existing logic to return rendered HTML
// 					// This might involve capturing the innerHTML of the rendered view
// 					resolve(html);
// 				}
// 			};
// 		});
//
// 		view.currentMode.renderer.set(markdown);
// 		return renderedPromise;
// 	}
//
// 	private postProcess(el: Element) {
// 		const links = el.querySelectorAll<HTMLAnchorElement>('a.internal-link');
// 		links.forEach((link) => {link.target = '';});
//
// 		const embeds = el.querySelectorAll<HTMLSpanElement>('span.internal-embed.markdown-embed.inline-embed');
//
// 		embeds.forEach((embed) => {
// 			if (embed.parentElement && embed.parentElement.parentElement) {
// 				embed.parentElement.parentElement.style.position = 'relative';
// 			}
// 			//TODO FROM HTML-SERVER: change link to anchor
// 		});
//
// 		const imagesContainers = el.querySelectorAll<HTMLDivElement>('.internal-embed.media-embed.image-embed');
//
// 		imagesContainers.forEach((imageContainer) => {
// 			const src = imageContainer.getAttribute('src') || '';
// 			const imageElement = imageContainer.querySelector('img');
// 			if (imageElement) imageElement.src = src;
// 		});
// 	}
// }
