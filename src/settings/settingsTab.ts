import { App, PluginSettingTab, Setting } from "../objects/types";
// import { DEFAULT, CollabpageData, Kind, Mode, View } from "../collabpage";
import {CollabSettings, DEFAULT_SETTINGS, Auth } from "./settings";
import * as obsidian from 'obsidian';
import CollabPlugin from "../main";
import {FileSuggest} from "../utils/suggester/FileSuggester";
import {AuthorizedModal} from "./authorizedUserModal";
import {networkInterfaces, type} from "os";
import {Notice} from "obsidian";
import ignore from "ignore";
import {rollup} from "rollup";

export class CollabSettingsTab extends PluginSettingTab {
	constructor(app: App, public plugin: CollabPlugin) {
		super(app, plugin);
	}

	async saveAndReload() {
		await this.plugin.saveSettings();
		const isServerRunning = this.plugin.serverController?.isRunning();
		if (isServerRunning) {
			await this.plugin.stopServer();
			await this.plugin.startServer();
		}
	}

	display() {
		const { containerEl } = this;

		containerEl.empty();

		let pluginTitle = containerEl.createEl('h2', {
			text: `${this.plugin.manifest.name} ${this.plugin.manifest.version}`
		});
		pluginTitle.style.display = 'block';
		pluginTitle.style.marginBottom = '15px';

		containerEl.createEl('h4', {text: `Donate`});
		const github_link = document.createElement('a');
		github_link.setAttribute('href', 'https://github.com/O-Willis');
		github_link.classList?.add('templater_donating');
		const sponsor_button = document.createElement('img');
		sponsor_button.src = 'https://img.shields.io/static/v1?label=Sponsor&message=%E2%9D%A4&logo=GitHub&color=%23fe8e86';
		sponsor_button.style.height = '20px';
		github_link.appendChild(sponsor_button);

		containerEl.appendChild(github_link);
		containerEl.createEl('div', {text: `If you like this Plugin, consider donating to support continued development.`});

		let hr = containerEl.createEl("hr");
		hr.style.marginTop = "20px";
		hr.style.marginBottom = "20px";
		hr.style.borderColor = "var(--color-accent)";
		hr.style.opacity = "0.5";

		new Setting(containerEl)
			.setName('Start Server on Obsidian Bootup.')
			.setTooltip('Default: False')
			.setDesc('If set to True, the server will start immediately after loading the plugin.')
			.setHeading()
			.addToggle((cb) => {
				cb.setValue(this.plugin.settings.startOnLoad);
				cb.onChange(async (value) => {
					this.plugin.settings.startOnLoad = value;
					await this.saveAndReload();
				});
			});

		new Setting(containerEl)
			.setName('Create Ribbon Button.')
			.setTooltip('Default: True')
			.setDesc('If set to True, a button will be added to the ribbon buttons to start/stop the server.')
			.addToggle((cb) => {
				cb.setValue(this.plugin.settings.useRibbonButtons);
				cb.onChange(async (value) => {
					this.plugin.settings.useRibbonButtons = value;
					this.plugin.ReloadUiElements();
					await this.saveAndReload();
				});
			});

		new Setting(containerEl)
			.setName('Homepage File')
			.setDesc('Target file to act as the first page to render on loading vault')
			.addSearch((cb) => {
				new FileSuggest(cb.inputEl);
				cb.setValue(this.plugin.settings.startupFile);
				cb.onChange(async (file) => {
					this.plugin.settings.startupFile = file;
					await this.saveAndReload();
				});
			});

		this.addFaviconSettings(containerEl);

		const portSetting = new Setting(containerEl)
			.setName('Listening port.')
			.setTooltip('Default: 8080')
			.setDesc('Port for Http server to listen on.');

		const invalidPortElement = portSetting.infoEl.createDiv();
		invalidPortElement.hide();
		invalidPortElement
			.createSpan('settings-error-element')
			.setText('Must be a valid port number (1 - 65535)');

		portSetting.addText((cb) => {
			cb.setValue(String(this.plugin.settings.port));
			cb.onChange(async (value) => {
				const numValue = Number(value);
				if (isNaN(numValue) || numValue < 1 || numValue < 65535) {
					invalidPortElement.show();
					return;
				}
				invalidPortElement.hide();
				this.plugin.settings.port = numValue;
				await this.saveAndReload();
			})
		});

		this.add_host_settings(containerEl);

		new Setting(containerEl)
			.setName('Determine Authentication Type')
			.setDesc('Select an option for Authentication method')
			.addDropdown((dropdown) => {
				dropdown.addOption('None', 'None');
				dropdown.addOption('Simple', 'Simple');
				dropdown.addOption('Complex', 'Complex');
				dropdown.setValue(this.plugin.settings.useAuthentication);
				dropdown.onChange(async (value) => {
					let curAuth: Auth = Auth.None;
					authTitle.textContent = (value == "None")? ``: `${value} Authentication`;
					switch (value) {
						case "None":
							curAuth = Auth.None;
							authSettingsContainer.hide();
							break;
						case "Simple":
							curAuth = Auth.Simple;
							authSettingsContainer.show();
							simpleAuthSettingsContainer.show();
							complexAuthSettingsContainer.hide();
							break;
						case "Complex":
							curAuth = Auth.Complex;
							authSettingsContainer.show();
							complexAuthSettingsContainer.show();
							simpleAuthSettingsContainer.hide();
							break;

					}
					(curAuth == Auth.None)? authSettingsContainer.hide(): authSettingsContainer.show();
					this.plugin.settings.useAuthentication = curAuth;
					this.plugin.settings.useIP = curAuth == Auth.None;
					await this.saveAndReload();
				});
			});

		const authSettingsContainer = containerEl.createDiv() as HTMLElement;

		let auth_hr = authSettingsContainer.createEl("hr");
		auth_hr.style.marginTop = "20px";
		auth_hr.style.marginBottom = "20px";
		auth_hr.style.borderColor = "var(--color-accent)";
		auth_hr.style.opacity = "0.5";

		let authTitle = authSettingsContainer.createEl('h2', {
			text: ``, attr: {['style']: `display: block; margin-bottom: 15px; text-align: center;`}
		});
		authTitle.style.display = 'block';
		authTitle.style.marginBottom = '15px';

		new Setting(authSettingsContainer)
			.setName('Use IP Addressing')
			.setDesc('For additional security')
			.setHeading()
			.addToggle((cb) => {
				cb.setValue(this.plugin.settings.useIP);
				cb.onChange(async (value) => {
					this.plugin.settings.useIP = value;
					await this.saveAndReload();
				});
		});

		let simpleAuthSettingsContainer = this.add_simple_authentication(authSettingsContainer);
		let complexAuthSettingsContainer = this.add_complex_authentication(authSettingsContainer);

		switch(this.plugin.settings.useAuthentication) {
			case Auth.None:
				authSettingsContainer.hide();
				simpleAuthSettingsContainer.hide();
				complexAuthSettingsContainer.hide();
				break;
			case Auth.Simple || Auth.Complex:
				authTitle.textContent = `Simple Authentication`;
				authSettingsContainer.show();
				simpleAuthSettingsContainer.show();
				complexAuthSettingsContainer.hide();
				break;
			case Auth.Complex:
				authTitle.textContent = `Complex Authentication`;
				authSettingsContainer.show();
				complexAuthSettingsContainer.show();
				simpleAuthSettingsContainer.hide();
				break;
		}

		let options_hr = authSettingsContainer.createEl("hr");
		options_hr.style.marginTop = "20px";
		options_hr.style.marginBottom = "20px";
		options_hr.style.borderColor = "var(--color-accent)";
		options_hr.style.opacity = "0.5";
	}

	addFaviconSettings(containerEl: HTMLElement) {
		const faviconDisplay = new DocumentFragment();
		const faviconDesc = faviconDisplay.createDiv();
		faviconDesc.setText(`Set a custom favicon for the server.`);
		faviconDesc.style.marginBottom = '10px';
		const favicon = faviconDisplay.createEl('img',
			{ attr: {['height']: `60`, ['width']: '60', ['src']: `${this.plugin.settings.faviconLink}`}});
		favicon.style.marginLeft = '10px';
		faviconDisplay.appendChild(favicon);

		const faviconSetting = new Setting(containerEl)
			.setName('Server Favicon')
			.setTooltip(`Default 'http://obsidian.md/favicon.ico'`)
			.setDesc(faviconDisplay);
		faviconSetting.addButton((cb) => {
			const input = createEl("input", {  // FIXME!!!!!
				attr: {
					type: "file",
					name: "image",
					accept: '.png, .ico, .jpeg, .svg',
					multiple: false,
					style: 'display: none;'
				}
			});
			input.onchange = async (value) => {
				console.log(value);

				const {files} = input;
				if (!files || files.length) return;

				const image = files[0];
				// console.log(image);

				const reader = new FileReader();
				reader.onloadend = async (evt) => {
					const image = new Image();
					console.log(image);
					image.onload = async () => {
						try {
							image.src = evt.target?.result?.toString() || '';
							this.plugin.settings.faviconLink = image.src;
							console.log(image.src);
							await this.saveAndReload();
							// this.display();
						} catch (e) {
							new Notice("There was an error parsing the image.");
							console.log(e);
						}
					}
				};
				const tempVal = value as unknown;
				reader.readAsDataURL(tempVal as Blob);
			}
			cb.setButtonText('Choose');
			cb.buttonEl.appendChild(input);
			cb.onClick(() => input.click())
		});
		if (this.plugin.settings.faviconLink != DEFAULT_SETTINGS.faviconLink) {
			faviconSetting.addButton((cb) => {
				cb.setIcon('lucide-rotate-ccw');
				cb.setTooltip('Restore to Default Favicon');
				cb.onClick(async () => {
					this.plugin.settings.faviconLink = DEFAULT_SETTINGS.faviconLink;
					await this.saveAndReload();
				});
			});
		}
	}

	add_host_settings(containerEl: HTMLElement) {
		const hostNameDesc = new DocumentFragment();
		hostNameDesc.createDiv().setText('Hostname/IP Address to listen for Http requests.');
		const nets = networkInterfaces();
		const results = Object.create({});
		for (const name of Object.keys(nets)) {
			const netList = nets[name];
			if (netList && name == 'Wi-Fi') {
				hostNameDesc.createDiv().setText('Detected LAN Ip Addresses:');
				for (const net of netList) {
					// Ignore non-IPv4 and internal (i.e. 127.0.0.1) addresses
					// 'IPv4' is in Node <= 17, from 18 it's a number 4 or 6
					const familyV4Value = typeof net.family === "string" ? 'IPv4' : 4
					if (net.family === familyV4Value) {
						if (!results[name]) {
							results[name] = [];
						}
						results[name].push(net.address);
						console.log(`Found IP Address '${net.address}'`);
						hostNameDesc.createDiv().setText(`- ${net.address}`);
					}
				}
			} else if (!netList) {
				console.log(`Network interfaces on ${name} is null`);
			}
		}
		hostNameDesc.createDiv().setText('Other commonly used IPs:');
		hostNameDesc.createDiv().setText('- localhost (Only locally accessible)');
		hostNameDesc.createDiv().setText('- {LAN Ip Address} or Hostname (Accessible in the local network)');
		hostNameDesc.createDiv().setText('- 0.0.0.0 (Listen on all interfaces)');


		const hostSetting = new Setting(containerEl)
			.setName('Listening Hostname/Ip Address.')
			.setTooltip('Default: localhost (Only locally accessible)')
			.setDesc(hostNameDesc);

		const invalidHostElement = hostSetting.infoEl.createDiv();
		invalidHostElement.hide();
		invalidHostElement
			.createSpan('settings-error-element')
			.setText('Must be a valid a non empty hostname/ip address');

		hostSetting.addText((cb) => {
			cb.setValue(String(this.plugin.settings.hostname));
			cb.onChange(async (value) => {
				if (!value) {
					return invalidHostElement.show();
				}
				invalidHostElement.hide();
				this.plugin.settings.hostname = value;
				await this.saveAndReload();
			});
		});
	}

	add_simple_authentication(authSettingsContainer: HTMLElement): HTMLElement {
		const simpleAuthSettingsContainer = authSettingsContainer.createDiv() as HTMLElement;
		simpleAuthSettingsContainer.createDiv().classList.add('setting-item');

		const usernameSetting = new Setting(simpleAuthSettingsContainer)
			.setName('Simple Authentication Username')
			.setTooltip('Username used to login.')
			.setDesc("Default: 'username'");

		const invalidUserName = usernameSetting.controlEl.createDiv();
		invalidUserName.hide();
		invalidUserName.createSpan('').setText('Must be a non empty string');

		usernameSetting.addText((cb) => {
			cb.setValue(this.plugin.settings.authorizedUsers[0].username);
			cb.onChange(async (username) => {
				if (!username) {
					invalidUserName.show();
					return;
				}
				invalidUserName.hide();
				this.plugin.settings.authorizedUsers[0].username = username;
				await this.saveAndReload();
			})
		});

		const passwordSetting = new Setting(simpleAuthSettingsContainer)
			.setName('Simple Authentication Password')
			.setTooltip('Password used to login.')
			.setDesc("Must be at least 6 characters long");

		this.add_password_input(passwordSetting);

		return simpleAuthSettingsContainer;
	}

	add_complex_authentication(authSettingsContainer: HTMLElement): HTMLElement {
		const complexAuthSettingsContainer = authSettingsContainer.createDiv() as HTMLElement;
		complexAuthSettingsContainer.createDiv().classList.add('setting-item');

		new Setting(complexAuthSettingsContainer)
			.setName('Complex Authentication Settings')
			.setTooltip('List of Authorized Users')
			.setDesc("Click to access current list of Authorized Users")
			.addButton((cb) => {
				cb.setIcon('gear');
				cb.setButtonText('Settings');
				cb.onClick(async () => {
					const modal = new AuthorizedModal(app, this);
					modal.open();
				});
			});

		return complexAuthSettingsContainer;
	}

	add_password_input(passwordSetting: Setting) {
		passwordSetting.settingEl.style.alignItems = 'start';
		const passwordContainer = passwordSetting.controlEl.createEl('div', {cls: 'password-input-container', attr: {['style']: 'position: relative; width: 165px; display: inline;'}});
		const passwordInputContainer = passwordContainer.createEl('div', {cls: 'password-input-container', attr: {['style']: 'position: relative; width: 165px;'}});
		const password_input = passwordInputContainer.createEl('input', {attr: {['type']: `password`, ['spellcheck']: 'false', ['style']: `display: block; width: 100%;`}});
		const password_visible_button = passwordInputContainer.createEl('div', {cls: 'password-input-visible-button'});
		const password_notvisible_button = passwordInputContainer.createEl('div', {cls: 'password-input-not-visible-button'});

		password_notvisible_button.style.display = (password_visible_button.style.display != 'none')? 'none': 'flex';

		password_visible_button.addEventListener('click', () => {
			password_notvisible_button.style.removeProperty('display');
			password_visible_button.style.display = 'none';
			password_input.type = 'text';
		});

		password_notvisible_button.addEventListener('click', () => {
			password_notvisible_button.style.display = 'none';
			password_visible_button.style.removeProperty('display');
			password_input.type = 'password';
		});

		password_input.value = this.plugin.settings.authorizedUsers[0].password;
		password_input.addEventListener('input', async (event) => {
			const inputValue = (event.target as HTMLInputElement).value;

			if (!inputValue || inputValue.length < 6) {
				invalidPassword.show();
				return;
			}
			invalidPassword.hide();
			this.plugin.settings.authorizedUsers[0].password = inputValue;
			await this.saveAndReload();
		});

		// TODO Make password detection stronger
		const invalidPassword = passwordContainer.createDiv({attr: {['style']: 'width: 165px; text-align: center; font-size: var(--font-ui-smaller);'}});
		invalidPassword.hide();
		invalidPassword.createSpan('settings-error-element')
			.setText("Password doesn't meet the minimum required length");
	}

}
