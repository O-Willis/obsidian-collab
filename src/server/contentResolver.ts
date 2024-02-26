import CollabPlugin from "../main";
import mime from 'mime-types';
import {INTERNAL_CSS_ENPOINT, INTERNAL_LOGIN_ENPOINT} from "./pathResolver";
import {Auth, ReplaceableVariables} from "../settings/settings";
import {LoginForm} from "../objects/pages/loginForm";
import {Page} from "../objects/pages/page";
import {NavigationOrder, SortOrder, SortType} from "../objects/pages/navigationResolver";
import {CustomMarkdownRenderer} from "../utils/renderer_tools/customMarkdownRenderer";

export const contentResolver = async (
	fpath: string, referer: string, plugin: CollabPlugin,
	markdownRenderer: CustomMarkdownRenderer,
	extraVars: ReplaceableVariables[] = [],
) => {
	if (fpath == INTERNAL_CSS_ENPOINT) {
		const fullCssText = Array.from(document.styleSheets)
			.flatMap((styleSheet) =>
				Array.from(styleSheet.cssRules).map((cssRule) => cssRule.cssText))
			.join('\n') + `\n.markdown-preview-view, .markdown-embed-content {height: unset !important;}`;
		return {
			contentType: 'text/css',
			payload: fullCssText,
			doc: '',
		};
	}
	if (fpath == INTERNAL_LOGIN_ENPOINT) {
		let nonce = extraVars[1].varValue;
		let loginForm: string = '';
		if (plugin.settings.useAuthentication == Auth.None) {
			loginForm = new LoginForm(plugin, fpath, referer, nonce).usernameLogin();
		} else {
			loginForm = new LoginForm(plugin, fpath, referer, nonce).retrieveHtml();
		}
		return {
			contentType: 'text/css',
			payload: loginForm,
			doc: '',
		};
	}
	const file = plugin.app.metadataCache.getFirstLinkpathDest(fpath, referer);
	if (!file) return null;

	if (file.extension === 'md') {
		const markdown = await file.vault.read(file);
		const navigationDefault: NavigationOrder = {order: SortOrder.Descending, type: SortType.FileName};
		const page = new Page(plugin, markdownRenderer, file, navigationDefault);
		const renderedMarkdown = await page.retrieveHTML(markdown)
		return {
			contentType: 'text/html',
			payload: renderedMarkdown,
			doc: markdown,
		};
	}
	const payload = await plugin.app.vault.readBinary(file);
	return {
		contentType: mime.lookup(file.extension) || 'text',
		payload: Buffer.from(payload),
		doc: payload,
	};
};
