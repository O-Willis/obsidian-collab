import CollabPlugin from "../main";
import mime from 'mime-types';
import {INTERNAL_CSS_ENPOINT, INTERNAL_LOGIN_ENPOINT} from "./pathResolver";
import {Auth, ReplaceableVariables} from "../settings/settings";
import {LoginForm} from "../objects/pages/loginForm";
import {Page} from "../objects/pages/page";
import {NavigationOrder, SortOrder, SortType} from "../objects/pages/navigationResolver";
import {CollabUser} from "./controller";

export const contentResolver = async (
	path: string,
	referer: string,
	plugin: CollabPlugin,
	extraVars: ReplaceableVariables[] = [],
) => {
	if (path == INTERNAL_CSS_ENPOINT) {
		const fullCssText =
			Array.from(document.styleSheets)
				.flatMap((styleSheet) =>
					Array.from(styleSheet.cssRules).map((cssRule) => cssRule.cssText)
			)
				.join('\n') +
			`\n.markdown-preview-view, .markdown-embed-content {height: unset !important;}`;
		return {
			contentType: 'text/css',
			payload: fullCssText,
		};
	}
	if (path == INTERNAL_LOGIN_ENPOINT) {
		let nonce = extraVars[1].varValue;
		// const loginForm = new Page(plugin, path, referer, nonce).retrieveHTML();
		let loginForm: string = '';
		if (plugin.settings.useAuthentication == Auth.None) {
			loginForm = new LoginForm(plugin, path, referer, nonce).usernameLogin();
		} else {
			loginForm = new LoginForm(plugin, path, referer, nonce).retrieveHtml();
		}
		return {
			contentType: 'text/css',
			payload: loginForm,
		};
	}

	const file = plugin.app.metadataCache.getFirstLinkpathDest(path, referer);
	if (!file) return null;

	const payload = await plugin.app.vault.readBinary(file);

	if (file.extension === 'md') {
		// let nonce = extraVars[1].varValue;
		// let page: Page = new Page(plugin, path, referer);
		// const pageHead = new PageHead(plugin.app.vault.getName(), plugin.settings.faviconLink, INTERNAL_CSS_ENPOINT);
		// const pageBody = new PageBody(plugin, plugin.app.workspace, ``, Buffer.from(payload));
		const navigationDefault: NavigationOrder = {order: SortOrder.Descending, type: SortType.FileName};
		const page = new Page(plugin, Buffer.from(payload), path, referer, navigationDefault);
		return {
			contentType: 'text/html',
			payload: page.retrieveHTML(),
		};
	}

	return {
		contentType: mime.lookup(file.extension) || 'text',
		payload: Buffer.from(payload)
	};
};
