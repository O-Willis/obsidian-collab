import {Modal, Setting, ButtonComponent, TextComponent, App} from 'obsidian';
import {CollabSettings, UserCredentials} from "./settings";
import CollabPlugin from "../main";
import {CollabSettingsTab} from "./settingsTab";
import {AddressInfo} from "net";

// export interface AuthorizedModelInfo  {
// 	canceled: boolean;
// 	currentUserList: UserCredentials[];
// 	isValidUser: boolean;
// }

export class AuthorizedModal extends Modal {
	// public AuthenticationInfo: AuthorizedModelInfo;
	private userPickerModalEl: HTMLElement | undefined;
	private listedUsers: UserCredentials[];
	private selectedUser: UserCredentials | undefined;

	constructor(app: App, private settingsTab: CollabSettingsTab) {
		super(app);
		this.listedUsers = settingsTab.plugin.settings.authorizedUsers;
		this.selectedUser = settingsTab.plugin.settings.authorizedUsers[0]; // Default
		// this.AuthenticationInfo = {canceled: false, currentUserList: this.listedUser, isValidUser: false};
	}

	overrideAuthorizedUsers(userCredentials: UserCredentials[]) {
		this.listedUsers = userCredentials;
	}

	close() {
		const { modalEl } = this;
		modalEl.empty();
		const { containerEl } = this;
		containerEl.empty();
		super.close();
		// this.isClosed = true;
	}

	open() {
		super.open();
		// this.isClosed = false;

		const { modalEl } = this;

		modalEl.style.cssText = `position: relative; z-index: 1; width: 20em; padding: 0; margin: 10px; max-height: 80%; box-shadow: 0 0 7px 1px inset #00000060;`;

		const authorizationTitle = modalEl.createEl('h5', {text: `Authorized Users`});
		authorizationTitle.style.display = 'block';
		authorizationTitle.style.margin = `2px 0 5px 8px`;
		// authorizationTitle.style.padding = `0`;

		let hr = modalEl.createEl("hr");
		hr.style.marginTop = "0";
		hr.style.marginBottom = "5px";
		hr.style.borderColor = "var(--color-accent)";
		hr.style.opacity = "0.5";

		let container = modalEl.createDiv({ cls: 'modal-content settings-table'}) as HTMLElement;
		container.style.height = "100%";
		container.style.width = "100%";
		container.style.padding = "0";
		container.style.margin = "0";
		container.style.display = "flex";
		container.style.flexDirection = "column";
		// container.style.alignItems = "flex-end";
		// container.style.cssText = `height: 100%; width: 100%; padding: 0; margin: 0; display: flex; flex-direction: column;`; // align-items: flex-end;

		let buttonArea = new Setting(container)
			.addButton((cb) => {
				cb.setIcon('trash')
				cb.onClick( async () => {
					console.log('Remove-button clicked');
					await this.settingsTab.saveAndReload();
				});
			})
			.addButton((cb) => {
				cb.setIcon('plus-with-circle');
				cb.onClick(async () => {
					this.listedUsers.push({
						username: '',
						password: '',
						IP: {address: '', family: '', port: -1}
					});
					this.selectedUser = this.listedUsers.last();
					this.listUsers(scrollArea);
					this.build_user_modal();
				});
			})
			.addButton((cb) => {
				cb.setIcon('refresh-ccw');
				cb.setTooltip('Restore to Previously Saved Users');
				cb.onClick(async () => {
					const modal = new Modal(app);
					modal.titleEl.append('Are you sure you want to restore the previously saved user list?');
					new Setting(modal.contentEl)
						.addButton((cb) => {
							cb.setButtonText('Restore');
							cb.setClass('mod-warning');
							cb.onClick(async () => {
								this.listedUsers = this.settingsTab.plugin.settings.authorizedUsers;
								modal.close();
							});
						})
						.addButton((cb) => {
							cb.setButtonText('Cancel');
							cb.onClick(() => {
								modal.close();
							});
						});
					modal.open();
				});
				cb.buttonEl.style.margin = '0 10px 0 auto';
			});
		buttonArea.infoEl.style.flex = '0';
		buttonArea.settingEl.style.justifyContent = `flex-start`;

		let scrollArea = container.createDiv({ cls: 'tree-scroll-area' }); // padding: 1em 1em 0 0;
		scrollArea.style.cssText = `height: 100%; width: 100%; padding: 1em 0 1em 0; overflow-x: hidden; overflow-y: auto; box-shadow: 0 0 7px 1px inset #00000060;`;
		scrollArea.style.borderRadius = '6px';
		// const userListContainer = scrollArea.createDiv('settings-table');
		// this.listUsers(userListContainer);
		this.listUsers(scrollArea);

		const save_button = new Setting(container)
			.setHeading()
			.addButton((cb) => {
				cb.setButtonText('Save');
				cb.buttonEl.style.paddingRight = `10px`;
				cb.onClick(async () => {
					this.settingsTab.plugin.settings.authorizedUsers = this.listedUsers;
					await this.settingsTab.saveAndReload();
					this.close();
					this.open();
				});
			});
		save_button.settingEl.style.marginRight = '10px';

		this.userPickerModalEl = this.containerEl.createDiv({cls: 'modal'});
		this.userPickerModalEl.hide();
		if (this.selectedUser) {
			this.build_user_modal();
		}
		// return this.AuthenticationInfo;
	}

	listUsers(userListContainer: HTMLElement) {
		userListContainer.empty();
		userListContainer.style.display = 'flex';
		userListContainer.style.flexDirection = 'column';
		userListContainer.style.alignItems = 'center';
		userListContainer.style.justifyContent = 'center';
		this.settingsTab.plugin.settings.authorizedUsers.forEach((userCred, index) => {
			const userContainer = userListContainer.createDiv({cls: 'user-container'});
			userContainer.style.width = '100%';
			userContainer.style.justifyContent = 'center';
			userContainer.style.alignItems = 'center';

			userContainer.addEventListener('click', async () => {
				this.selectedUser = userCred;
				this.build_user_modal();
			})

			const user = new Setting(userContainer);
			const userElement = userContainer.createDiv({cls: 'user-element'});
			userElement.innerText = userCred.username;

			user.infoEl.append(userElement);
			user.infoEl.style.paddingLeft = '0.75em';
			user.infoEl.style.fontSize = `var(--font-ui-large)`;
			user.addExtraButton((cb) => {
				cb.extraSettingsEl.style.zIndex = '90';
				cb.setIcon('x');
				cb.extraSettingsEl.classList?.add('mod-warning');
				cb.onClick(async () => {
					this.userPickerModalEl?.hide();
					const modal = new Modal(this.app);
					modal.titleEl.append(`Are you sure you want to delete user ${userCred.username}?`);
					new Setting(modal.contentEl)
						.addButton((cb) => {
							cb.setButtonText('Delete');
							cb.setClass('mod-warning');
							cb.onClick(async () => {
								console.log('Delete');
								this.settingsTab.plugin.settings.authorizedUsers =
									this.settingsTab.plugin.settings.authorizedUsers.filter(
										(_, i) => i !== index
									);
								this.selectedUser = undefined;
								await this.settingsTab.plugin.saveSettings();
								this.listUsers(userListContainer);
								modal.close();
							});
						})
						.addButton((cb) => {
							cb.setButtonText('Cancel');
							cb.onClick(() => {
								modal.close();
								this.userPickerModalEl?.show();
							});
						});
				});
			});

			userElement.querySelector(`div.setting-editor-extra-setting-button.mod-warning`)?.addEventListener('click', async () => {
				console.log('CLicked on delete');
			});
			user.settingEl.style.padding = '0.1em 0 0.20em 0'; //padding: 1em 0 1em 0
			user.settingEl.style.margin = '0 1em 0 1em'; //padding: 1em 0 1em 0
			user.settingEl.style.justifyContent = 'center';
			user.settingEl.style.alignItems = 'center';
			user.settingEl.style.border = 'var(--border-width) solid var(--background-modifier-border)';
			user.settingEl.style.borderRadius = 'var(--input-radius)';
		});
	}

	build_user_modal() {
		if (!this.userPickerModalEl) {
			this.userPickerModalEl = this.containerEl.createDiv({cls: 'modal'});
		}
		this.userPickerModalEl?.empty();
		this.userPickerModalEl.style.width = '30em';
		this.userPickerModalEl.show();
		const authModalTitle = this.userPickerModalEl.createEl('h4', {text: `'${this.selectedUser?.username}'`})
		authModalTitle.style.display = 'block';
		authModalTitle.style.marginBottom = '15px';

		const onChangeList: OnChangeUsers = async (
			newValue,
			type,
			_currentUserValue,
			index
		) => {
			if (!newValue) {
				return {status: "Error"};
			}

			if (index >= this.settingsTab.plugin.settings.authorizedUsers.length) {
				this.settingsTab.plugin.settings.authorizedUsers[index] = {
					username: '',
					password: '',
					IP: {address: '', family: '', port: -1},
				};
			}
			switch (type) {
				case 'username':
					this.settingsTab.plugin.settings.authorizedUsers[index].username = newValue;
					break;
				case 'password':
					this.settingsTab.plugin.settings.authorizedUsers[index].password = newValue;
					break;
				case 'IP':
					this.settingsTab.plugin.settings.authorizedUsers[index].IP = newValue;
					break;
			}

			await this.settingsTab.saveAndReload();
			return {status: 'OK'};
		};

		setUsers(this.userPickerModalEl, this.settingsTab.plugin, this.listedUsers, this.selectedUser, onChangeList);

		let errorMessage = this.userPickerModalEl.createDiv({cls: 'setting-item-description'});
		errorMessage.style.cssText = `color: var(--color-red); margin-bottom: 0.75rem;`;
	}
}

function createEdditable(line: HTMLElement, index: number,
	text: string | AddressInfo, type: 'username' | 'password' | 'IP',
	eventListener: (target: HTMLInputElement, type: 'username' | 'password' | 'IP') => Promise<OnChangeStatus>) {
	const subEdditable = new Setting(line)
		.setName(type)
		.setTooltip(`${type} used to login`);

	const invalid = subEdditable.infoEl.createDiv();
	invalid.hide();
	invalid.createSpan('settings-error-element')
		.setText((typeof text == 'string')?
			((text == 'username')? 'Must be a non empty string': 'Must be at least 6 characters long'):
			'Invalid IP address');

	subEdditable.addText((cb) => {
		if (typeof text === "string") {
			cb.setValue(text);
		} else {
			cb.setValue(text.port.toString());
		}
		let updateTimeout: NodeJS.Timeout;
		let to: NodeJS.Timeout;
		cb.inputEl.onchange = ({ target }) => {
			clearTimeout(updateTimeout);
			updateTimeout = setTimeout(async () => {
				const { status } = await eventListener(
					target as HTMLInputElement,
					type
				);
				if (status == 'Error') {
					invalid.show();
					subEdditable.settingEl.classList?.add('with-error');
					subEdditable.settingEl.classList?.remove('with-success');
				} else {
					invalid.hide();
					subEdditable.settingEl.classList?.remove('with-error');
					subEdditable.settingEl.classList?.add('with-success');
					clearTimeout(to);
					to = setTimeout(() => {
						subEdditable.settingEl.classList?.remove('with-success');
						subEdditable.settingEl.classList?.remove('with-error');
					}, 500);
				}
			}, 100);
		};
	});

	// subEdditable.settingEl.style.alignItems = 'start';
	// if (type != 'password') {
	//
	// } else {
	// 	const container = subEdditable.controlEl.createEl('div', {cls: 'password-input-container', attr: {['style']: 'position: relative; width: 165px; display: inline;'}});
	// 	const inputContainer = container.createEl('div', {cls: 'password-input-container', attr: {['style']: 'position: relative; width: 165px;'}});
	// 	const input = inputContainer.createEl('input', {attr: {['type']: `password`, ['spellcheck']: 'false', ['style']: `display: block; width: 100%;`}});
	// 	const visible_button = inputContainer.createEl('div', {cls: 'password-input-visible-button'});
	// 	const notvisible_button = inputContainer.createEl('div', {cls: 'password-input-not-visible-button'});
	// 	// TODO Make password detection stronger
	// 	const invalidPassword = container.createDiv({attr: {['style']: 'width: 165px; text-align: center; font-size: var(--font-ui-smaller);'}});
	// 	invalidPassword.hide();
	// 	invalidPassword.createSpan('settings-error-element')
	// 		.setText("Password doesn't meet the minimum required length");
	//
	//
	// 	notvisible_button.style.display = (visible_button.style.display != 'none')? 'none': 'flex';
	// 	visible_button.addEventListener('click', () => {
	// 		notvisible_button.style.removeProperty('display');
	// 		visible_button.style.display = 'none';
	// 		input.type = 'text';
	// 	});
	// 	notvisible_button.addEventListener('click', () => {
	// 		notvisible_button.style.display = 'none';
	// 		visible_button.style.removeProperty('display');
	// 		input.type = 'password';
	// 	});
	// 	if (!text || text.toString().length < 6) {
	// 		invalidPassword.show();
	// 		return subEdditable;
	// 	}
	// 	// input.addEventListener('input', async (event) => {
	// 	// 	const inputValue = (event.target as HTMLInputElement).value;
	// 	//
	// 	// 	if (!inputValue || inputValue.length < 6) {
	// 	// 		invalidPassword.show();
	// 	// 	} else {
	// 	// 		invalidPassword.hide();
	// 	// 		input.value = inputValue;
	// 	// 	}
	// 	// });
	//
	// 	let updateTimeout: NodeJS.Timeout;
	// 	let to: NodeJS.Timeout;
	// 	input.onchange = ({ target }) => {
	// 		clearTimeout(updateTimeout);
	// 		if (!text || text.toString().length < 6) {
	// 			invalidPassword.show();
	// 		} else {
	// 			invalidPassword.hide();
	// 		}
	// 		updateTimeout = setTimeout(async () => {
	// 			const { status } = await eventListener(target as HTMLInputElement, type);
	// 			if (status == 'Error') {
	// 				invalidPassword.show();
	// 				subEdditable.settingEl.classList?.add('with-error');
	// 				subEdditable.settingEl.classList?.remove('with-success');
	// 			} else {
	// 				invalidPassword.hide();
	// 				subEdditable.settingEl.classList?.remove('with-error');
	// 				subEdditable.settingEl.classList?.add('with-success');
	// 				clearTimeout(to);
	// 				to = setTimeout(() => {
	// 					subEdditable.settingEl.classList?.remove('with-success');
	// 					subEdditable.settingEl.classList?.remove('with-error');
	// 				}, 500);
	// 			}
	// 		}, 100);
	// 	};
	// }
	return subEdditable;
}

function setUsers(element: HTMLElement, plugin: CollabPlugin, listedUsers: UserCredentials[], selectedUser: UserCredentials | undefined, onChange: OnChangeUsers) {
	listedUsers.forEach((userCred, index) => {
		const eventListener = async (
			target: HTMLInputElement,
			type: 'username' | 'password' | 'IP'
		) => {
			const value = target.value;
			return await onChange(value, type, listedUsers, index);
		}
		if (userCred == selectedUser) {
			const line = element.createDiv() as HTMLElement;
			line.createDiv().classList.add('setting-item');
			createEdditable(line, index, userCred.username, 'username', eventListener);
			createEdditable(line, index, userCred.password, 'password', eventListener);
			if (plugin.settings.useIP) {
				if (userCred.IP) {
					createEdditable(line, index, userCred.IP, 'IP', eventListener);
				}
			}
			let authModal_hr = line.createEl("hr");
			authModal_hr.style.marginTop = "20px";
			authModal_hr.style.marginBottom = "20px";
			authModal_hr.style.borderColor = "var(--color-accent)";
			authModal_hr.style.opacity = "0.5";
			line.createDiv().setText('Click the "Save" button to keep changes');
		}
	})
}

type OnChangeUsers = (
	newValue: string,
	type: 'username' | 'password' | 'IP',
	currentUserValue: CollabSettings['authorizedUsers'],
	index: number
) => Promise<OnChangeStatus>;

type OnChangeStatus = { status: 'OK' | 'Error' };
