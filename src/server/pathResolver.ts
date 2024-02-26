import { App } from 'obsidian';

export const INTERNAL_LOGIN_ENPOINT = '/.obsidian/plugins/obsidian-collab/login.html';
export const INTERNAL_CSS_ENPOINT = '/.obsidian/plugins/obsidian-collab/app.css';
export const INTERNAL_JS_ENDPOINT = '/.obsidian/plugins/obsidian-collab/scripts.js';

export const tryResolveFilePath: (
	requestedUrl: string,
	resolveFrom: string,
	app: App
) => string | null = (requestedUrl, resolveFrom, app) => {
	console.log(`${requestedUrl}`);
	if ([INTERNAL_CSS_ENPOINT, INTERNAL_LOGIN_ENPOINT].includes(requestedUrl))
		return requestedUrl;

	const requestedFile = app.metadataCache.getFirstLinkpathDest(
		requestedUrl.substring(1),
		resolveFrom
	);

	if (requestedFile) return requestedFile.path;

	//@ts-ignore
	return global.app.fileManager[requestedUrl.substring(1)];
};
