// import express, {Handler, Request} from 'express';
// import expressSession from 'express-session';
//
// import {Server as HttpServer} from "http";
// import WebSocket, {WebSocketServer} from "ws";
// import CollabPlugin from "../main";
// import * as passport from 'passport';
// import * as fs from 'fs';
// import {Strategy as LocalStrategy} from 'passport-local';
// import {randomBytes} from "crypto";
// import {INTERNAL_LOGIN_ENPOINT, tryResolveFilePath} from "./pathResolver";
// import {contentResolver} from "./contentResolver";
// import {Auth} from "../settings/settings";
// import bodyParser from "body-parser";
//
// import * as grpc from '@grpc/grpc-js';
// import {req} from "agent-base";
// // import { CollabServiceService, ICollabServiceServer } from './generated/collab_service_grpc_pb';
// // import { FileContentUpdate } from './generated/collab_service_pb';
//
// interface ClientSubscription {
// 	socket: WebSocket.WebSocket;
// 	user: Express.User;
// }
//
// interface Subscription {
// 	socket: WebSocket.WebSocket;
// 	subscribedFile: string;
// }
//
// export class ServerController {
// 	app: express.Application;
// 	server?: HttpServer;
// 	wss?: WebSocketServer;
// 	// A map to keep track of which clients are editing which files
// 	private fileSubscriptions: Map<string, Set<ClientSubscription>> = new Map();
// 	// A map to keep track of what clients are subscribed to what file
// 	private clients: Map<Express.User, Subscription> = new Map();
//
// 	private sessionMiddleware = expressSession({
// 		secret: randomBytes(16).toString('base64'),
// 		resave: false,
// 		saveUninitialized: true,
// 		// Add other configuration options as needed.
// 	});
//
// 	constructor(private plugin: CollabPlugin) {
// 		this.app = express();
//
// 		// this.app.use(expressSession({secret: randomBytes(16).toString('base64')}));
// 		this.app.use(this.sessionMiddleware);
// 		this.app.use(passport.initialize());
// 		this.app.use(passport.session());
//
// 		passport.serializeUser(function (user, done) {
// 			done(null, user);
// 		});
//
// 		passport.deserializeUser(function (user, done) {
// 			done(null, {user});
// 		});
//
// 		passport.use(
// 			new LocalStrategy((username, password, done) => {
// 				// let usingIP = this.plugin.settings.useIP;
// 				if (plugin.settings.useAuthentication == Auth.None) {
// 					if (!this.clients.has({ username })) {
// 						done(null, { username });
// 						return;
// 					} else {
// 						done('That name has already been chosen!');
// 					}
// 				} else {
// 					if (username === this.plugin.settings.authorizedUsers[0].username && password === this.plugin.settings.authorizedUsers[0].password) {
// 						done(null, { username });
// 						return;
// 					}
// 					// let validCredentials = this.plugin.settings.authorizedUsers;
// 					// let curUser: UserCredentials = {username: '', password: '', IP: {address: '', family: '', port: -1}};
// 					// var listener = this.app.listen(plugin.settings.port, function () {
// 					// 	console.log("Listening on port " + listener.address());
// 					// 	curUser.IP = listener.address();
// 					// });
// 					//
// 					// for (let item of validCredentials) {
// 					// 	let validCreds = (username === item.username && password === item.password);
// 					// 	if (validCreds && (usingIP && curUser.IP === item.IP)) {
// 					// 		console.log("Credentials are valid");
// 					// 		done(null, { username });
// 					// 		return;
// 					// 	}
// 					// }
// 					done('Incorrect Credentials');
// 				}
// 			})
// 		);
//
// 		this.app.use(express.urlencoded());
//
// 		// protects the path so the user (route guard) to prevent user from adding to the link and accessing page contents
// 		this.app.post('/login', passport.authenticate('local', {}), (req, res) => {
// 			res.redirect(req.body.redirectUrl || '/');
// 		});
//
// 		// this.wss?.on('connection', (ws: WebSocket, req: express.Request) => {
// 		// 	console.log("=======  Websocket Connection  =======");
// 		// 	console.log(ws);
// 		// 	console.log(req);
// 		// 	const user = req.user;
// 		// 	console.log(user);
// 		//
// 		// 	if (user) {
// 		// 		console.log(`WebSocket connected for user: ${user}`);
// 		// 		// Do whatever you need with the WebSocket connection and user information
// 		// 	} else {
// 		// 		console.log('WebSocket connected, but no user information available');
// 		// 	}
// 		// });
//
// 		this.app.use('/', this.authenticate, async (req, res) => {
// 			console.log('Received payload, writing to server...');
// 			let path = decodeURI(req.path);
// 			let activeUsers: string[] = [];
//
// 			if (!path || path == '/') {
// 				if (plugin.settings.startupFile != '') {
// 					path = '/' + plugin.settings.startupFile;
// 				} else if (plugin.settings.recentFile) {
// 					// console.log("PATH PLEASE::   "+ plugin.settings.recentFile.path);
// 					path = '/' + plugin.settings.recentFile.path;
// 				} else {
// 					path = '/' + plugin.app.workspace.getActiveFile();  // TODO add check later
// 				}
// 			}
//
// 			const resolveFromPath = getResolveFromPath(req);
//
// 			const resolvedPath = tryResolveFilePath(path, resolveFromPath, app);
//
// 			if (!resolvedPath) {
// 				res.status(404).write(`Couldn't resolve file at path '${req.path}'`);
// 				res.end();
// 				return;
// 			}
//
// 			if (!('/' + resolvedPath === path || resolvedPath === path)) {
// 				res.redirect('/' + resolvedPath);
// 				res.end();
// 				return;
// 			}
//
// 			// TODO NOTE TO SELF, ADD CLIENT HERE!!!!
// 			this.wss?.on('connection', (ws) => {
// 				// this.initializeClient(req.user, ws, path);
// 				this.handleClient(req.user, ws, resolvedPath);
// 			});
//
// 			this.fileSubscriptions.get(path)?.forEach((client) => {
// 				// if (client.user != req.user) {
// 				// 	const userData = JSON.parse(client.user.toString());
// 				// 	activeUsers.push(userData.username);
// 				// }
// 				const userData = JSON.parse(client.user.toString());
// 				console.log(`Adding user: ${userData.username}`);
// 				activeUsers.push(userData.username);
// 			});
//
// 			console.log("=== Clients ===");
// 			console.log(this.clients);
// 			console.log("=== FileSubscriptions ===");
// 			console.log(this.fileSubscriptions);
// 			console.log(`Content Resolver on Active Users`);
// 			console.log(activeUsers);
// 			const r = await contentResolver(path, resolveFromPath, this.plugin, []);
//
// 			if (!r) {
// 				res.status(404).write(`Error reading file at path '${req.path}'`);
// 				res.end();
// 				return;
// 			}
//
// 			res.contentType(r.contentType);
// 			res.write(r.payload);
// 			res.end();
// 		});
// 	}
//
// 	// TODO
// 	// Look up a github repo on a messaging app / chatroom
// 	// Could be geared more towards TCP
// 	// Confluence uses UDP
// 	// SO I WILL USE UDP
//
// 	async start() {
// 		if (!this.server || !this.server.listening) {
// 			this.server = await new Promise<HttpServer | undefined>((resolve) => {
// 				try {
// 					if (this.server?.listening) return resolve(this.server);  // Websocket error might be here
// 					const server = this.app.listen(this.plugin.settings.port, this.plugin.settings.hostname, () => {
// 						resolve(server);
// 					});
//
// 					if (!this.wss) {this.wss = new WebSocketServer({ server });}
// 					this.app.use(bodyParser.json());
// 				} catch (error) {
// 					console.error('error trying to start the server', error);
// 					resolve(undefined);
// 				}
// 			});
// 		}
// 	}
//
// 	async stop() {
// 		if (this.server && this.server.listening) {
// 			await new Promise<void>((resolve) => {
// 				this.wss?.close((err) => {
// 					console.log('There was a WebSocketServer error');
// 					err && console.error(err);
// 					resolve();
// 				});
// 				this.server?.close((err) => {
// 					console.log('There was a server error');
// 					err && console.error(err);
// 					resolve();
// 				})
// 			})
// 		}
// 	}
//
// 	async reload() {
// 		if (!this.isRunning()) return;
// 		await this.stop();
// 		await this.start();
// 	}
//
// 	isRunning() {return this.server?.listening;}
//
// 	// setupWebSocketServer(server: HttpServer) {
// 	// 	this.wss = new WebSocketServer({ noServer: true });
// 	// 	console.log("server exists");
// 	// 	const none: any = null;
// 	// 	this.server?.on('upgrade', (request: any, socket: any, head: any) => {
// 	// 		console.log("==========  server upgrade  ==========");
// 	// 		this.sessionMiddleware(request, none, () => {
// 	// 			if (request.session.passport && request.session.passport.user) {
// 	// 				const user = request.session.passport.user;
// 	// 				console.log('User Authenticated');
// 	// 				console.log(user);
// 	// 				// If the user is authenticated, establish a WebSocket connection
// 	// 				this.wss?.handleUpgrade(request, socket, head, (ws) => {
// 	// 					this.wss?.emit('connection', ws, request);
// 	// 					this.setupClient(ws, user);  // Pass the user object to your setup function
// 	// 				});
// 	// 			} else {
// 	// 				socket.destroy();
// 	// 			}
// 	// 		});
// 	// 	});
// 	// }
//
// 	authenticate: Handler = async (req, res, next) => {
// 		if (req.user) {
// 			return next();
// 		}
//
// 		const resolveFromPath = getResolveFromPath(req);
// 		const path = tryResolveFilePath(req.path, resolveFromPath, this.plugin.app);  // TODO Add path resolution
//
// 		res.contentType('text/html; charset=UTF-8');
//
// 		if (path && [`.css`, `.ico`].find((ext) => path.endsWith(ext))) return next();
//
// 		const nonce = randomBytes(32).toString('base64');
//
// 		res.contentType('text/html; charset=UTF-8');
// 		res.setHeader('Content-Security-Policy', `script-src 'nonce-${nonce}'`);
//
// 		const content = await contentResolver(INTERNAL_LOGIN_ENPOINT, '/', this.plugin, [
// 			{varName: 'REDIRECT_URL', varValue: req.url,},
// 			{varName: 'NONCE', varValue: nonce,},
// 		]);
//
// 		res.send(content?.payload);
// 	}
//
// 	handleClient(user: Express.User | undefined, ws: WebSocket, path: string) {
// 		if (!user) return;
// 		if (path && path.endsWith(`.md`)) {
// 			console.log(`===== WebSocket client connected to ${path} =====`);
// 			console.log(`Setting up client to Websocket`);
// 			this.subscribeToFile(path, {socket: ws, user: user});
// 		}
// 		this.setupClientWebSocket(user as Express.User, ws);
// 	}
//
// 	//Set up the client connection and track the user and page access
// 	setupClientWebSocket(user: Express.User, ws: WebSocket) {
// 		ws.on('message', (data) => {
// 			const message = JSON.parse(data.toString());
// 			console.log(`'message: ${message.type}' event with user: ${user}`);
// 			// console.log(message.text);
// 			const filePath = message.url;
// 			if (message.type === 'subscribe') {
// 				console.log(`Server side got 'subscribe' message. Subscribing user to file`);
// 			} else if (message.type === 'update') { // Handle file edits and broadcast changes
// 				console.log(`Config path: ${message.url}`);
// 				const updatedHtmlContent = message.text;
// 				this.plugin.app.vault.adapter.write(filePath, updatedHtmlContent); // Save updated content to local file system
// 				this.broadcastUpdate(filePath, message.content, user);
// 			}
// 		});
//
// 		ws.on('close', () => { // Clean up when the WebSocket connection is closed
// 			const currentFile = this.clients.get(user)?.subscribedFile;
// 			if (currentFile) {
// 				this.unsubscribeFromFile(currentFile, user, ws);
// 			}
// 			// else {
// 			// 	console.log('========= Deleting User and Websocket! =========');
// 			// 	this.clients.delete(user);
// 			// 	ws.terminate();
// 			// }
// 		});
// 	}
//
// 	subscribeToFile(filepath: string, client: ClientSubscription) {
// 		if (filepath == '/') return;
// 		console.log(`Subscribing ${client.user} to ${filepath}`);
//
// 		if (!this.fileSubscriptions.has(filepath)) {
// 			this.fileSubscriptions.set(filepath, new Set());
// 		} else {
// 			if (!this.fileSubscriptions.get(filepath)?.has(client)) {
// 				this.fileSubscriptions.get(filepath)?.add(client);
// 				this.clients.set(client.user, { socket: client.socket, subscribedFile: filepath });
// 			}
// 		}
// 	}
//
// 	unsubscribeFromFile(filepath: string, user: Express.User, socket: WebSocket) {
// 		const subscriptions = this.fileSubscriptions.get(filepath);
// 		if (subscriptions) {
// 			for (const client of subscriptions) {
// 				if (client.user === user) {
// 					console.log(`Unsubscribing ${client}`);
// 					(this.fileSubscriptions.get(filepath as string) as Set<ClientSubscription>).delete(client);
// 					this.clients.set(client.user, { socket: client.socket, subscribedFile: '/'});
// 					break;
// 				}
// 			}
// 			if (subscriptions.size === 0) {
// 				this.fileSubscriptions.delete(filepath);
// 			}
// 		}
// 	}
//
// 	broadcastUpdate(filepath: string, content: string, username: Express.User) {
// 		console.log(`Broadcasting changes!`);
// 		const subscriptions = this.fileSubscriptions.get(filepath);
// 		if (subscriptions) {
// 			for (const client of subscriptions) {
// 				if (client.user !== username) { // Prevent sending update back to the user who made the change
// 					client.socket.send(JSON.stringify({ type: 'update', url: filepath, text: content }));
// 				}
// 			}
// 		}
// 	}
// }
//
// const getResolveFromPath = (req: Request) => {
// 	const url = new URL(req.headers?.referer || 'http://localhost/');
// 	const fromPath = decodeURIComponent(url.pathname || '/');
// 	return fromPath.substring(1);
// };
