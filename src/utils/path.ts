// const pathTools = require('upath');
import { Stats, existsSync, promises as fs } from 'fs';
import { FileSystemAdapter, Notice, App } from "obsidian";
import { Utils } from './utils';
import internal from "stream";

// export const tryResolveFilePath: (
// 	requestedUrl: string,
// 	resolveFrom: string,
// 	app: App
// ) => string | null = (requestedUrl, resolveFrom, app) => {
// 	if ([INTERNAL_CSS_ENPOINT, INTERNAL_LOGIN_ENPOINT].includes(requestedUrl))
// 		return requestedUrl;
//
// 	const requestedFile = app.metadataCache.getFirstLinkpathDest(
// 		requestedUrl.substring(1),
// 		resolveFrom
// 	);
//
// 	if (requestedFile) return requestedFile.path;
//
// 	//@ts-ignore
// 	return global.app.fileManager[requestedUrl.substring(1)];
// };
