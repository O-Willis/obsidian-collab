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

export interface CollabUser extends Express.User {
	userId: string;
	username: string;
	userColor: string;
}

function generateUserId() {
	// Implement your logic to generate a unique userId
	return randomBytes(16).toString('base64');
}

function generateUserColor() {
	return '#'+(0x1000000+Math.random()*0xffffff).toString(16).substr(1,6);
}

function mapToObject(map: Map<string, CollabUser[]>): { [key: string]: CollabUser[] } {
	const obj: { [key: string]: CollabUser[] } = {};
	map.forEach((value, key) => {
		obj[key] = value;
	});
	return obj;
}

export class ServerController {
	app: express.Application;
	server?: HttpServer;
	io?: Server;
	// A map to keep track of which clients are editing which files
	private fileSubscriptions: Map<string, Array<CollabUser>> = new Map();
	private clients: Map<string, string> = new Map();

	private detectUser(newUser: CollabUser): CollabUser | undefined {
		this.fileSubscriptions.forEach((users, filepath) => {
			users.forEach((activeUser) => {
				if (activeUser.userId === newUser.userId) {
					return activeUser;
				}
			});
		});
		return undefined;
	}


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

		passport.serializeUser(function (user: Express.User, done) {
			done(null, user);
		});
		passport.deserializeUser(function (user: Express.User, done) {
			done(null, user);
		});

		passport.use(
			new LocalStrategy((username, password, done) => {
				let newUser: CollabUser = { userId: generateUserId(), username: username, userColor: generateUserColor() }; // Assign a userId
				if (plugin.settings.useAuthentication == Auth.None) {
					while (this.detectUser(newUser)) {
						newUser.userId = generateUserId();
					}
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

		this.app.use(express.urlencoded());

		// protects the path so the user (route guard) to prevent user from adding to the link and accessing page contents
		this.app.post('/login', passport.authenticate('local', {}), (req, res) => {
			res.redirect(req.body.redirectUrl || '/');
		});

		this.app.use('/', this.authenticate, async (req, res) => {
			let path = decodeURI(req.path);

			if (!path || path == '/') {
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

			this.handleIOSocketServer(resolvedPath, req);

			const r = await contentResolver(path, resolveFromPath, this.plugin, []);

			if (!r) {
				res.status(404).write(`Error reading file at path '${req.path}'`);
				res.end();
				return;
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

		res.contentType('text/html; charset=UTF-8');

		if (path && [`.css`, `.ico`].find((ext) => path.endsWith(ext))) return next();

		const nonce = randomBytes(32).toString('base64');

		res.contentType('text/html; charset=UTF-8');
		res.setHeader('Content-Security-Policy', `script-src 'nonce-${nonce}'`);

		const content = await contentResolver(INTERNAL_LOGIN_ENPOINT, '/', this.plugin, [
			{varName: 'REDIRECT_URL', varValue: req.url,},
			{varName: 'NONCE', varValue: nonce,},
		]);

		res.send(content?.payload);
	}

	handleIOSocketServer(resolvedPath: string, req: Request) {
		this.io?.once("connection", (socket) => {
			console.log(`New connection to ${resolvedPath}`);
			// Handle new socket connection
			socket.once('join', (pageTitle: string) => {
				this.handleSocketClient(socket, 'join', req.user as CollabUser, pageTitle);
				return;
			});

			socket.once('disconnect', (pageTitle: string) => {
				this.handleSocketClient(socket, 'disconnect', req.user as CollabUser, pageTitle);
				return;
			});

			socket.on('textUpdate', (userId, filePath, updatedTextContent) => {
				this.plugin.app.vault.adapter.write(filePath, updatedTextContent); // Save updated content to local file system
				return;
			});

		});
		console.log("=== FileSubscriptions ===");
		console.log(this.fileSubscriptions);
	}

	handleSocketClient(socket: Socket, event: string, user: CollabUser | undefined, filepath: string) {
		if (!user) return;
		if (filepath && filepath != '/' && filepath.endsWith('.md')) {
			if (event === 'join') {
				// console.log(`1. === Client '${user.username}' connected to ${filepath} ===`);
				console.log(`on 'join', resolvedPath:`);
				console.log(filepath);
				this.subscribeToFile(socket, user, filepath);
			} else if (event === 'disconnect') {
				// console.log(`=== Client ${user.username} disconnected to ${filepath} ===`);
				console.log(`on 'disconnect', resolvedPath:`);
				console.log(filepath);
				// Remove user from the list of active users for the page
				this.unsubscribeFromFile(socket, user, filepath);
			}
			// Emit updated user list to all clients on the page
			this.io?.emit('updatedUserList', user as any, filepath as any, mapToObject(this.fileSubscriptions) as any);
		}
	}

	subscribeToFile(socket: Socket, curUser: CollabUser, filepath: string) {
		if (!this.fileSubscriptions.has(filepath)) {
			this.fileSubscriptions.set(filepath, new Array<CollabUser>());
		}
		let isSubscribed: boolean = false;
		let activeUsers = this.fileSubscriptions.get(filepath);
		activeUsers!.forEach((activeUser) => {
			if (activeUser?.userId === curUser?.userId) {
				console.log(`Comparing ${activeUser.userId} and ${curUser.userId}`);
				console.log(`${activeUser.username} already Subscribed to ${filepath}`);
				isSubscribed = true;
			}
		});
		if (!isSubscribed) {
			console.log(curUser);
			console.log(this.clients.get(curUser.userId));
			if (!this.clients.get(curUser.userId)) {
				console.log(`socket joined ${filepath}!`);
				socket.join(filepath);
				this.clients.set(curUser.userId, filepath);
				this.fileSubscriptions.get(filepath)?.push(curUser);
			} else if (this.clients.get(curUser.userId) != filepath) {
				console.log(`Moving ${curUser.username} from '${this.clients.get(curUser.userId)}' to '${filepath}'`);
				this.unsubscribeFromFile(socket, curUser, this.clients.get(curUser.userId) as string);
				socket.join(filepath);
				this.clients.set(curUser.userId, filepath);
				this.fileSubscriptions.get(filepath)?.push(curUser);
			}
		}
	}

	unsubscribeFromFile(socket: Socket, user: CollabUser, filepath: string) {
		const subscriptions = this.fileSubscriptions.get(filepath);
		if (subscriptions) {
			for (const curUser of subscriptions) {
				if (curUser.userId === user.userId) {
					this.fileSubscriptions.get(filepath)?.remove(curUser);
					console.log(`socket leaving ${filepath}!`);
					this.clients.delete(curUser.userId);
					// Emit updated user list to all clients on the page
					socket.leave(filepath);
					break;
				}
			}
			if (subscriptions.length === 0) {
				this.fileSubscriptions.delete(filepath);
			}
		}
	}
}

const getResolveFromPath = (req: Request) => {
	const url = new URL(req.headers?.referer || 'http://localhost/');
	const fromPath = decodeURIComponent(url.pathname || '/');
	return fromPath.substring(1);
};
