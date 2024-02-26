import {PageInfo} from "./pages/page";
import {Socket} from "socket.io";
import {Auth, CollabSettings, UserCredentials} from "../settings/settings";
import {randomBytes} from "crypto";
import {Update} from "@codemirror/collab";

export interface CollabUser extends Express.User {
	userId: string;
	socketId: string;
	username: string;
	password: string;
	userColor: string;
	userCursor: {line: number, ch: number};
}

function generateUserId() {
	// Implement your logic to generate a unique userId
	return randomBytes(16).toString('base64');
}

function generateUserColor() {
	return '#'+(0x1000000+Math.random()*0xffffff).toString(16).substr(1,6);
}

export class ServerInfo {
	// A map to keep track of which clients are editing which files
	private fileSubscriptions: Map<string, PageInfo>;
	private clients: Map<string, string>;

	constructor() {
		this.fileSubscriptions = new Map();
		this.clients = new Map();
	}

	getFileSubs(): Map<string, PageInfo> {
		return this.fileSubscriptions;
	}

	hasFilePath(filePath: string): boolean {
		return this.fileSubscriptions.has(filePath);
	}

	getPage(filePath: string): PageInfo {
		return this.fileSubscriptions.get(filePath)!;
	}

	isSubscribed(filePath: string, curUser: CollabUser) {
		this.fileSubscriptions.get(filePath)!.activeUsers!.forEach((activeUser: CollabUser) => {
			if (activeUser?.userId === curUser?.userId) {
				// console.log(`${activeUser.username} already Subscribed to ${filepath}`);
				return true;
			}
		});
		return false;
	}

	assignUserValue(filePath: string, reqUser: Express.User, callback: (user: CollabUser) => { line: number; ch: number }) {
		if (this.fileSubscriptions.get(filePath)) {
			const activeUsers = this.fileSubscriptions.get(filePath)?.activeUsers;
			if (activeUsers) {
				activeUsers.forEach((curUser: CollabUser) => {
					if (curUser.userId === (reqUser as CollabUser).userId) {
						console.log('FOUND USER');
						callback(curUser);
					}
				});
			}
		}
	}

	private detectUser(newUser: CollabUser): CollabUser | undefined {
		this.fileSubscriptions.forEach((users, filepath) => {
			users.activeUsers.forEach((activeUser: CollabUser) => {
				if (activeUser.userId === newUser.userId) {
					return activeUser;
				}
			});
		});
		return undefined;
	}

	generateNewUser(username: string, password: string) {
		let newUser: CollabUser = { userId: generateUserId(), username: username, password: password,
			userColor: generateUserColor(), socketId: '', userCursor: {line: 1, ch: 0} }; // Assign a userId
		while (this.detectUser(newUser)) {
			newUser.userId = generateUserId();
		}
		return newUser;
	}

	exportToPageInfo(): { [key: string]: CollabUser[] } {
		const obj: { [key: string]: CollabUser[] } = {};
		this.fileSubscriptions.forEach((value, key) => {
			obj[key] = value.activeUsers as CollabUser[];
		});
		return obj;
	}

	subscribeToFile(socket: Socket, curUser: CollabUser, filepath: string, doc: string): boolean {
		if (!this.hasFilePath(filepath)) {
			this.fileSubscriptions.set(filepath, new PageInfo(doc))
		}
		if (!this.isSubscribed(filepath, curUser)) {
			if (!this.clients.get(curUser.userId)) {
				// console.log(`socket joined ${filepath}!`);
				socket.join(filepath);
				this.clients.set(curUser.userId, filepath);
				this.fileSubscriptions.get(filepath)!.activeUsers.push(curUser);
				return true;
			} else if (this.clients.get(curUser.userId) != filepath) {
				// console.log(`Moving ${curUser.username} from '${this.clients.get(curUser.userId)}' to '${filepath}'`);
				this.unsubscribeFromFile(socket, curUser, this.clients.get(curUser.userId) as string);
				socket.join(filepath);
				this.clients.set(curUser.userId, filepath);
				this.fileSubscriptions.get(filepath)!.activeUsers.push(curUser);
				return true;
			}
		}
		return false;
	}

	unsubscribeFromFile(socket: Socket, user: CollabUser, filepath: string) {
		const subscriptions = this.fileSubscriptions.get(filepath)!.activeUsers;
		if (subscriptions) {
			for (const curUser of subscriptions) {
				if (curUser.userId === user.userId) {
					this.fileSubscriptions.get(filepath)?.activeUsers.remove(curUser);
					// console.log(`socket leaving ${filepath}!`);
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
