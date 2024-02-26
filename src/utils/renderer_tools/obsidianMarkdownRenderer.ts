import {App, MarkdownPreviewRenderer, MarkdownView, WorkspaceLeaf} from "../../objects/types";
import CollabPlugin from "../../main";
import {CustomMarkdownRenderer} from "./customMarkdownRenderer";
import {Editor, MarkdownEditView, MarkdownPreviewView, MarkdownRenderer, MarkdownSourceView, TFile} from "obsidian";
import {Utils} from "../utils";

export class ObsidianMarkdownRenderer extends CustomMarkdownRenderer {
	rootElement: HTMLDivElement;

	constructor(private plugin: CollabPlugin, private app: App) {
		super();
		this.patchObsidianMarkdownRenderer();
		this.rootElement = this.getOrCreateRootDomElement();
	}

	private patchObsidianMarkdownRenderer() {
		const originalQueueRenderFn = MarkdownPreviewRenderer.prototype.queueRender;

		const alteredQueueRenderFn: typeof originalQueueRenderFn = function (this: MarkdownPreviewRenderer) {
			this.rendered || (this.rendered = []);
			const e = this.queued;
			const t = !this.parsing;
			if (e && t && !e.high) {
				e.cancel();
				const timeOut = setTimeout(this.onRender.bind(this), 0);
				this.queued = {
					high: true,
					cancel: () => clearTimeout(timeOut)
				};
			} else {
				const n = t ? 0 : 200;
				const timeOut = setTimeout(this.onRender.bind(this), n);
				this.queued = {
					high: !n,
					cancel: () => clearTimeout(timeOut)
				}
			}
		};

		MarkdownPreviewRenderer.prototype.queueRender = alteredQueueRenderFn;

		this.plugin.register(() => {
			MarkdownPreviewRenderer.prototype.queueRender = originalQueueRenderFn;
		})
	}

	private getOrCreateRootDomElement() {
		const maybe = document.querySelector<HTMLDivElement>(`body .html-server-rendering-element`);
		if (!maybe) {
			const rootEl = document.body.createEl('div');
			rootEl.addClass('html-server-rendering-element');
			return rootEl;
		}
		return maybe;
	}

	async renderHtmlFromMarkdown(markdown: string, file: TFile, viewMode: 'preview' | 'edit' | 'source'): Promise<Element> {
		//@ts-ignore
		const leaf = new WorkspaceLeaf(this.app);

		const el = this.rootElement.createDiv();
		leaf.containerEl = el;

		const view = new MarkdownView(leaf);
		leaf.view = view;

		let renderedContent: Element;
		if (viewMode === 'source') {
			renderedContent = document.createElement('div') as Element;
			let curEditor = new MarkdownView(leaf).editor;
			curEditor.setValue(markdown);
			//@ts-ignore
			const tempContent = curEditor.containerEl;
			const html_content = tempContent.querySelectorAll('div[class$="cm-active"]');
			html_content.forEach((divElement: HTMLDivElement) => {
				divElement.classList.remove('cm-active');
			})
			renderedContent.appendChild(tempContent);
		} else if (viewMode === 'preview') {
			let n = 0;
			// @ts-ignore
			view.currentMode = new MarkdownPreviewView(leaf.view);
			view.currentMode.type = viewMode;
			const viewType = view.getViewType();

			let contentPromise = new Promise<Element>((resolve, _reject) => {
				view.currentMode.onRenderComplete = () => {
					if (view.currentMode.renderer.queued) {
						return;
					}
					if (!n++) {
						const callouts = view.currentMode.renderer.previewEl.querySelectorAll(`.callout-icon svg`);
						callouts.forEach((el) => {
							el.parentElement?.removeChild(el);
						});
						//@ts-ignore
						view.currentMode.renderer.sections.forEach((section) => {
							const promises: Promise<void>[] = [];
							//@ts-ignore
							view.currentMode.renderer.owner.postProcess(
								section,
								promises,
								//@ts-ignore
								view.currentMode.renderer.frontmatter
							);
							if (promises.length) {
								//@ts-ignore
								view.currentMode.renderer.asyncSections.push(section);
								Promise.all(promises).then(function () {
									//@ts-ignore
									view.currentMode.renderer.asyncSections.remove(section),
										section.resetCompute(),
										view.currentMode.renderer.queueRender();
								});
							}
						});
						view.currentMode.renderer.onRender(); // Force a rerender to update everything that needs css (callout-icons, etc?)
						return;
					}

					this.postProcess(view.currentMode.renderer.previewEl);
					const html = view.currentMode.renderer.previewEl;


					leaf.detach();
					this.rootElement.removeChild(el);
					resolve(html);
				};
			});
			view.currentMode.renderer.set(markdown);
			renderedContent = (await contentPromise);
			let success = await Utils.waitUntil(() => renderedContent != undefined, 2000, 10);
			if (!success || !renderedContent) return document.createElement('div') as Element;
		} else {
			renderedContent = document.createElement('div') as Element;
		}
		// console.log(renderedContent);
		return renderedContent;
	}

	private postProcess(el: Element) {
		const links = el.querySelectorAll<HTMLAnchorElement>('a.internal-link');
		links.forEach((link) => {link.target = '';});

		const embeds = el.querySelectorAll<HTMLSpanElement>('span.internal-embed.markdown-embed.inline-embed');

		embeds.forEach((embed) => {
			if (embed.parentElement && embed.parentElement.parentElement) {
				embed.parentElement.parentElement.style.position = 'relative';
			}
			//TODO FROM HTML-SERVER: change link to anchor
		});

		const imagesContainers = el.querySelectorAll<HTMLDivElement>('.internal-embed.media-embed.image-embed');

		imagesContainers.forEach((imageContainer) => {
			const src = imageContainer.getAttribute('src') || '';
			const imageElement = imageContainer.querySelector('img');
			if (imageElement) imageElement.src = src;
		});
	}

	// public renderEditMode(renderedContent: Element, pageEditor: Editor): Element {
	// 	if (!renderedContent.firstElementChild) return document.createElement('div');
	// 	console.log('Source:');
	// 	console.log(pageEditor.getLine(0));
	// 	console.log(pageEditor.getLine(1));
	// 	console.log(pageEditor.getLine(2));
	// 	console.log(pageEditor.getDoc());
	// 	const childList = renderedContent.firstElementChild.children;
	// 	const tempContainer = document.createElement('div');
	// 	for (let i = 0; i < childList.length && childList.item(i); i++) {
	// 		const line = childList.item(i);
	// 		if (line && [`markdown-preview-pusher`, `mod-header`, `mod-footer`].some(className => line?.classList.contains(className))) {continue}
	//
	// 		console.log(line);
	// 		tempContainer.appendChild(line as HTMLElement);
	// 	}
	// 	return tempContainer;
	// }
}
