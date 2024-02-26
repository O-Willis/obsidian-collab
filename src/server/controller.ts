import express, {Handler, Request} from 'express';
import expressSession from 'express-session';

import {Server as HttpServer} from "http";
import { Server, Socket } from 'socket.io';
import CollabPlugin from "../main";
import * as passport from 'passport';
import {Strategy as LocalStrategy} from 'passport-local';
import {randomBytes} from "crypto";
import {INTERNAL_LOGIN_ENPOINT, tryResolveFilePath} from "./pathResolver";
import {contentResolver} from "./contentResolver";
import {Auth} from "../settings/settings";
import bodyParser from "body-parser";
import {ObsidianMarkdownRenderer} from "../utils/renderer_tools/obsidianMarkdownRenderer";
import {CustomMarkdownRenderer} from "../utils/renderer_tools/customMarkdownRenderer";
import {CollabUser, ServerInfo} from "../objects/serverInfo";
import {ChangeSet, Text} from "@codemirror/state";
import {rebaseUpdates, Update} from "@codemirror/collab";

let pending: ((value: any) => void)[] = []

export class ServerController {
	app: express.Application;
	server?: HttpServer;
	io?: Server;
	markdownRenderer: CustomMarkdownRenderer;
	// A map to keep track of which clients are editing which files
	private serverInfo: ServerInfo = new ServerInfo();

	private sessionMiddleware = expressSession({
		secret: randomBytes(16).toString('base64'),
		resave: false,
		saveUninitialized: true,
		// Add other configuration options as needed.
	});

	constructor(private plugin: CollabPlugin) {
		this.app = express();

		this.app.use(this.sessionMiddleware);
		this.app.use(passport.initialize());
		this.app.use(passport.session());

		passport.serializeUser(function (user: Express.User, done) {done(null, user);});
		passport.deserializeUser(function (user: Express.User, done) {done(null, user);});

		this.markdownRenderer = new ObsidianMarkdownRenderer(plugin, plugin.app);

		passport.use(
			new LocalStrategy((username, password, done) => {
				let newUser: CollabUser = this.serverInfo.generateNewUser(username, password);
				if (plugin.settings.useAuthentication == Auth.None) {
					done(null, newUser);
					return;
				} else {
					if (username === this.plugin.settings.authorizedUsers[0].username &&
						password === this.plugin.settings.authorizedUsers[0].password) {
						done(null, newUser);
						return;
					}
					done('Incorrect Credentials');
				}
			})
		);

		// Decodes the special characters in a url
		this.app.use(express.urlencoded());

		// protects the path so the user (route guard) to prevent user from adding to the link and accessing page contents
		this.app.post('/login', passport.authenticate('local', {}), (req, res) => {
			let indexpath = '';
			res.redirect(req.body.redirectUrl || '/' + indexpath);
		});

		// TODO express add to path instead of replace

		this.app.use('/', this.authenticate, async (req, res) => {
			let path = decodeURI(req.path);
			// console.log('Decoded path: ', path);

			if (!path || path == '/') {
				// console.log('Startup File: '+plugin.settings.startupFile);
				if (plugin.settings.startupFile != '') {
					path = '/' + plugin.settings.startupFile;
				} else if (plugin.settings.recentFile) {
					path = '/' + plugin.settings.recentFile.path;
				} else {
					path = '/' + plugin.app.workspace.getActiveFile();  // TODO add check later
				}
			}

			const resolveFromPath = getResolveFromPath(req);

			const resolvedPath = tryResolveFilePath(path, resolveFromPath, app);

			if (!resolvedPath) {
				res.status(404).write(`Couldn't resolve file at path '${req.path}'`);
				res.end();
				return;
			}

			if (!('/' + resolvedPath === path || resolvedPath === path)) {
				console.log(`res.redirect on /${resolvedPath}`);
				res.redirect('/' + resolvedPath);
				res.end();
				return;
			}

			const r = await contentResolver(path, resolveFromPath, this.plugin, this.markdownRenderer);

			if (!r) {
				res.status(404).write(`Error reading file at path '${req.path}'`);
				res.end();
				return;
			}

			if (r.contentType == 'text/html') {
				this.handleIOSocketServer(resolvedPath, req, r.doc.toString());
			}

			res.contentType(r.contentType);
			res.write(r.payload);
			res.end();
		});
	}

	async start() {
		if (!this.server || !this.server.listening) {
			this.server = await new Promise<HttpServer | undefined>((resolve) => {
				try {
					if (this.server?.listening) return resolve(this.server);  // Websocket error might be here
					const server = this.app.listen(this.plugin.settings.port, this.plugin.settings.hostname, () => {
						resolve(server);
					});
					if (!this.io) this.io = new Server(server);
					this.app.use(bodyParser.json());
				} catch (error) {
					console.error('error trying to start the server', error);
					resolve(undefined);
				}
			});
		}
	}

	async stop() {
		if (this.server && this.server.listening) {
			await new Promise<void>((resolve) => {
				this.server?.close((err) => {
					console.log('There was a server error');
					err && console.error(err);
					resolve();
				})
			})
		}
	}

	async reload() {
		if (!this.isRunning()) return;
		await this.stop();
		await this.start();
	}

	isRunning() {return this.server?.listening;}

	authenticate: Handler = async (req, res, next) => {
		if (req.user) {
			return next();
		}

		const resolveFromPath = getResolveFromPath(req);
		const path = tryResolveFilePath(req.path, resolveFromPath, this.plugin.app);  // TODO Add path resolution

		// console.log(`Authenticate Path: ${path}`);

		res.contentType('text/html; charset=UTF-8');

		if (path && [`.css`, `.ico`].find((ext) => path.endsWith(ext))) return next();

		const nonce = randomBytes(32).toString('base64');

		res.contentType('text/html; charset=UTF-8');
		res.setHeader('Content-Security-Policy', `script-src 'nonce-${nonce}'`);

		const content = await contentResolver(INTERNAL_LOGIN_ENPOINT, '/', this.plugin, this.markdownRenderer, [
			{varName: 'REDIRECT_URL', varValue: req.url,},
			{varName: 'NONCE', varValue: nonce,},
		]);

		res.send(content?.payload);
	}

	handleIOSocketServer(fpath: string, req: Request, doc: string) {
		this.io?.once("connection", (socket) => {
			console.log(`New connection to ${fpath}`);
			// Handle new socket connection
			socket.once('join', (pageTitle: string) => {
				this.handleSocketClient(this.io, socket, 'join', req.user as CollabUser, pageTitle, doc);
			});

			socket.once('disconnect', (pageTitle: string) => {
				this.handleSocketClient(this.io, socket, 'disconnect', req.user as CollabUser, pageTitle, '');
			});

			socket.once('getDocument', (filePath) => {
				let curDoc = this.serverInfo.getPage(filePath).doc;
				let serverVersion = this.serverInfo.getPage(filePath).updates;
				socket.to(filePath).emit('getDocument', serverVersion, curDoc);
			});

			socket.once('textUpdate', (filePath, version, updatedTextContent) => {
				console.log('TextUpdate');
				this.plugin.app.vault.adapter.write(filePath, updatedTextContent); // Save updated content to local file system
				socket.to(filePath).emit('contentUpdated', updatedTextContent);
			});

			socket.once('pullUpdates', (filePath, clientVersion) => {
				const requestPage = this.serverInfo.getPage(filePath);
				const serverUpdates = requestPage.updates;
				const serverVersion = serverUpdates.length;
				if (serverVersion > clientVersion) {
					console.log('Server sending new updates');
					socket.to(filePath).emit('pulledUpdates', serverVersion, serverUpdates);
				} else {
					console.log('No new updates to send');
					socket.to(filePath).emit('pulledUpdates', serverVersion, []);
				}
			});

			socket.on('pushUpdates', (filePath, version, updatedTextContent) => { // push updated content to all users on page
				// console.log('pushUpdates got called');
				let newUpdates = [];
				let curPage = this.serverInfo.getPage(filePath);
				let curUpdates = curPage.updates;
				let curDoc = curPage.doc;
				let curVersion = curUpdates.length;
				let received = updatedTextContent.map((json: Update) => ({
					clientID: json.clientID,
					changes: ChangeSet.fromJSON(json.changes)
				}));
				if (version != updatedTextContent.length) {
					received = rebaseUpdates(received, updatedTextContent.slice(version));
				}
				console.log('Pushing new Updates');
				for (let update of received) {
					newUpdates.push(update);
					curDoc = update.changes.apply(curDoc);
				}
				if (curUpdates.length > 0) {
					console.log(curUpdates);
					console.log(curVersion);
					console.log('Current Doc');
					console.log(curDoc);
				}
				// this.plugin.app.vault.adapter.write(filePath, updatedTextContent); // Save updated content to local file system
				socket.emit('pushedUpdates', curVersion, curUpdates);
				// socket.to(filePath).emit('pushedUpdates', curVersion, curUpdates);
			});

			socket.on('cursorMove', (filePath: string, cursorPos: {line: number, ch: number}) => { // push updated content to all users on page
				if (req.user) {
					// console.log(`Client '${(req.user as CollabUser).username}' moved cursor on page ${filePath}`);
					// console.log(cursorPos);
					if (this.serverInfo.hasFilePath(filePath)) {
						this.serverInfo.assignUserValue(filePath, req.user!, (user) => user.userCursor = cursorPos);
					}
					const pageUsers = this.serverInfo.exportToPageInfo()[filePath];
					// console.log(pageUsers);
					socket.to(filePath).emit('cursorUpdate', req.user as any, pageUsers);
				}
			});

		});
		// console.log("=== FileSubscriptions ===");
		// console.log(this.serverInfo.getFileSubs());
	}

	handleSocketClient(io: Server | undefined, socket: Socket, event: string, user: CollabUser | undefined,
					   filepath: string, doc: string) {
		if (!user) return;
		if (!io) return;
		if (user.socketId === '') {
			console.log(`ASSIGNING ${user.username} TO SOCKET ID: ${socket.id}`);
			user.socketId = socket.id;
		}
		if (filepath && filepath != '/' && filepath.endsWith('.md')) {
			if (event === 'join') {
				console.log(`on 'join', resolvedPath: ${filepath}`);
				this.serverInfo.subscribeToFile(socket, user, filepath, doc);
				let curPage = this.serverInfo.getPage(filepath);
				socket.emit('RenderEditor', user, curPage.updates.length, curPage.doc);  // TODO this sends twice!!
			} else if (event === 'disconnect') {
				console.log(`on 'disconnect', resolvedPath:`);
				console.log(filepath);
				// Remove user from the list of active users for the page
				this.serverInfo.unsubscribeFromFile(socket, user, filepath);
			}
			// Emit updated user list to all clients on the page
			let curVersion = this.serverInfo.getPage(filepath).updates.length;
			this.io?.emit('updatedUserList', user as any, filepath as any,
				this.serverInfo.exportToPageInfo() as any, curVersion as any);
		}
	}
}

const getResolveFromPath = (req: Request) => {
	const url = new URL(req.headers?.referer || 'http://localhost/');
	const fromPath = decodeURIComponent(url.pathname || '/');
	return fromPath.substring(1);
};
