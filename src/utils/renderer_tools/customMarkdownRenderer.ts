import {Editor, TFile} from "obsidian";

export abstract class CustomMarkdownRenderer {
	abstract renderHtmlFromMarkdown(markdown: string, file: TFile, viewMode: string): Promise<Element>;

	// abstract renderEditMode(renderedContent: Element, pageEditor: Editor): Element;
}
