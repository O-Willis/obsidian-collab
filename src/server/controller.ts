import express, {Handler, Request} from 'express';
import expressSession from 'express-session';

import {Server as HttpServer} from "http";
import WebSocket, {WebSocketServer} from "ws";
import CollabPlugin from "../main";
import * as passport from 'passport';
import * as fs from 'fs';
import {Strategy as LocalStrategy} from 'passport-local';
import {randomBytes} from "crypto";
import {INTERNAL_LOGIN_ENPOINT, tryResolveFilePath} from "./pathResolver";
import {contentResolver} from "./contentResolver";
import {Auth} from "../settings/settings";
import bodyParser from "body-parser";
// import { v4 as uuidv4 } from 'uuid';

export class ServerController {
	app: express.Application;
	server?: HttpServer;
	wss?: WebSocketServer;
	private activeUsers: Express.User[] = [];

	// A map to keep track of which clients are editing which files
	private fileToClientsMap: Map<string, Set<WebSocket.WebSocket>> = new Map();

	constructor(private plugin: CollabPlugin) {
		this.app = express();

		this.app.use(expressSession({secret: randomBytes(16).toString('base64')}));
		this.app.use(passport.initialize());
		this.app.use(passport.session());

		passport.serializeUser(function (user, done) {
			done(null, user);
		});

		passport.deserializeUser(function (user, done) {
			done(null, {user});
		});

		passport.use(
			new LocalStrategy((username, password, done) => {
				// let usingIP = this.plugin.settings.useIP;
				console.log(plugin.settings.useAuthentication);
				if (plugin.settings.useAuthentication == Auth.None) {
					done(null, { username });
					return;
				} else {
					if (username === this.plugin.settings.authorizedUsers[0].username && password === this.plugin.settings.authorizedUsers[0].password) {
						done(null, { username });
						return;
					}
					// let validCredentials = this.plugin.settings.authorizedUsers;
					// let curUser: UserCredentials = {username: '', password: '', IP: {address: '', family: '', port: -1}};
					// var listener = this.app.listen(plugin.settings.port, function () {
					// 	console.log("Listening on port " + listener.address());
					// 	curUser.IP = listener.address();
					// });
					//
					// for (let item of validCredentials) {
					// 	let validCreds = (username === item.username && password === item.password);
					// 	if (validCreds && (usingIP && curUser.IP === item.IP)) {
					// 		console.log("Credentials are valid");
					// 		done(null, { username });
					// 		return;
					// 	}
					// }
					done('Incorrect Credentials');
				}
			})
		);

		this.app.use(express.urlencoded());

		this.app.post('/login', passport.authenticate('local', {}), (req, res) => {
			console.log("Redirect on " + req.body.redirectUrl);
			res.redirect(req.body.redirectUrl || '/');
		});

		this.app.use('/', this.authenticateIfNeeded, async (req, res) => {
			let path = decodeURI(req.path);
			if (path == '\\update-html-endpoint') {
				return;
			}

			if (!path || path == '/') {
				if (plugin.settings.startupFile != '') {
					path = '/' + plugin.settings.startupFile;
				} else if (plugin.settings.recentFile) {
					console.log("PATH PLEASE::   "+ plugin.settings.recentFile.path);
					path = '/' + plugin.settings.recentFile.path;
				} else {
					path = '/' + plugin.app.workspace.getActiveFile();  // TODO add check later
				}
			} else {
				console.log(`PATH EXISTS: ${path}`);
			}

			const resolveFromPath = getResolveFromPath(req);

			const resolvedPath = tryResolveFilePath(path, resolveFromPath, app);

			console.log(resolvedPath);

			if (!resolvedPath) {
				res.status(404).write(`Couldn't resolve file at path '${req.path}'`);
				res.end();
				return;
			}

			if (!('/' + resolvedPath === path || resolvedPath === path)) {
				res.redirect('/' + resolvedPath);
				res.end();
				return;
			}

			const r = await contentResolver(path, resolveFromPath, this.plugin);

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

	// TODO
	// Look up a github repo on a messaging app / chatroom
	// Could be geared more towards TCP
	// Confluence uses UDP
	// SO I WILL USE UDP

	async start() {
		if (!this.server || !this.server.listening) {
			this.server = await new Promise<HttpServer | undefined>((resolve) => {
				try {
					if (this.server?.listening) return resolve(this.server);
					const server = this.app.listen(this.plugin.settings.port, this.plugin.settings.hostname, () => {
						resolve(server);
					});

					this.wss = new WebSocketServer({ server });
					this.wss.on('connection', (ws) => {
						console.log('WebSocket client connected');
						let currentFile: string | null = null;

						ws.on('message', (data) => {
							console.log("ws.on message: ", data.toString());
							const parsedData = JSON.parse(data.toString());
							if (parsedData.event === 'open') {
								// Client is opening a file, track this client

								currentFile = parsedData.url;
								if (!this.fileToClientsMap.has(currentFile as string)) {
									console.log("Tracking new client:");
									console.log(ws);
									this.fileToClientsMap.set(currentFile as string, new Set());
								}
								this.fileToClientsMap.get(currentFile as string)?.add(ws);
							} else if (parsedData.event === 'edit') {
								// Client has made an edit, broadcast to other clients
								console.log(`Config path: ${parsedData.url}`);
								const updatedHtmlContent = parsedData.text;
								// const configPath = this.plugin.app.vault.configDir + parsedData.url;
								// Save the updated content to the local file system
								this.plugin.app.vault.adapter.write(parsedData.url, updatedHtmlContent);

								const clients = this.fileToClientsMap.get(currentFile as string);
								if (clients) {
									clients.forEach(client => {
										if (client !== ws) {
											client.send(JSON.stringify({ event: 'update', url: currentFile as string, text: updatedHtmlContent }));
										}
									});
								}
							}
						});

						ws.on('close', () => {
							// Client has disconnected, remove them from the tracking map
							if (currentFile && this.fileToClientsMap.has(currentFile)) {
								const clients = this.fileToClientsMap.get(currentFile);
								clients?.delete(ws);
								if (clients?.size === 0) {
									this.fileToClientsMap.delete(currentFile);
								}
							}
						});
					});

					this.app.use(bodyParser.json());

					this.app.post('/update-html-endpoint', (req, res) => {
						let path = decodeURI(req.path);
						const newHtmlContent = req.body;
						console.log(`Redirect on ${req.body.redirectUrl}`);

						console.log(`\\update-html-endpoint content: ${newHtmlContent}`);
						console.log(`\\update-html-endpoint path: ${path}`);

						// Update the HTML file on the server's filesystem
						fs.writeFile('file.md', newHtmlContent, (err) => {
							if (err) {
								console.error('Error writing HTML file:', err);
								res.status(500).send('Error updating content');
								return;
							}
							res.send({ message: 'Content updated successfully' });
						});
					});
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
				this.wss?.close((err) => {
					err && console.error(err);
				});
				this.server?.close((err) => {
					err && console.error(err);
					this.activeUsers = [];
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

	isRunning() {
		return this.server?.listening;
	}

	authenticateIfNeeded: Handler = async (req, res, next) => {
		// if (this.plugin.settings.useAuthentication == Auth.None) return next();

		if (req.user) {
			this.activeUsers.push(req.user);
			console.log(req.user);
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
			{
				varName: 'REDIRECT_URL',
				varValue: req.url,
			},
			{
				varName: 'NONCE',
				varValue: nonce,
			},
		]);

		res.send(content?.payload);
	}

	getActiveUsers(): Express.User[] {
		return this.activeUsers;
	}
}

const getResolveFromPath = (req: Request) => {
	const url = new URL(req.headers?.referer || 'http://localhost/');
	const fromPath = decodeURIComponent(url.pathname || '/');
	return fromPath.substring(1);
};
