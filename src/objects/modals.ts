import {App, Modal, Notice} from "obsidian";
import CollabPlugin from "../main";

export class ErrorOnAddressModal extends Modal {  // TODO Issues with making modal appear
	constructor(app: App, private hostname: string, private port: number) {
		super(app);
		const { contentEl } = this;
		const { containerEl } = this;
		const { modalEl } = this;
		containerEl.empty();
		contentEl.empty();
		modalEl.style.borderWidth = '3px';
		modalEl.style.borderColor = 'rgb(90, 0, 0)';
		modalEl.style.color = 'rgb(90, 0, 0)';
		modalEl.style.backgroundColor = 'brown';
		modalEl.style.width = 'fit-content';
		modalEl.style.fontWeight = 'bold';
		contentEl.style.alignItems = 'center';
		contentEl.style.textAlign = 'center';

		containerEl.setAttribute('id', 'errorModal');

		const modalBG = document.getElementsByClassName('modal-bg')[0];
		if (modalBG === containerEl.firstChild) {
			containerEl.removeChild(modalBG);
			const newModalBG = document.createElement('div');
			newModalBG.classList.add('modal-bg');
			newModalBG.setAttribute('style', 'opacity: 0;');
			containerEl.prepend(newModalBG);
			newModalBG.addEventListener('click', () => {
				this.close();
			});
		}

		const modalShake = [
			{transform: 'translateX(0) translateY(0)'},
			{transform: 'translateX(5px) translateY(5px)'},
			{transform: 'translateX(0) translateY(0)'},
			{transform: 'translateX(-5px) translateY(-5px)'},
			{transform: 'translateX(0) translateY(0)'},
			{transform: 'translateX(5px) translateY(-5px)'},
			{transform: 'translateX(0) translateY(0)'},
			{transform: 'translateX(-5px) translateY(5px)'}];
		const shakeTiming = {duration: 200, iterations: 2};
		containerEl.animate(modalShake, shakeTiming);
		contentEl.createEl('div').innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-siren"><path d="M7 12a5 5 0 0 1 5-5v0a5 5 0 0 1 5 5v6H7v-6Z"/><path d="M5 20a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v2H5v-2Z"/><path d="M21 12h1"/><path d="M18.5 4.5 18 5"/><path d="M2 12h1"/><path d="M12 2v1"/><path d="m4.929 4.929.707.707"/><path d="M12 12v6"/></svg>`;
		contentEl.createEl('h2', {text: 'Address Not Available!'});
		const modalText = contentEl.createEl('p', {text: 'Seems like you were trying to connect to '});
		modalText.createEl('a', {href : `http://${this.hostname}:${this.port}/`, text: `${this.hostname}:${this.port}`});
		contentEl.createEl('p', {text: 'Please recheck the host address in the settings.'});
	}
}

export class ConfirmModal extends Modal {
	constructor(app: App, text: string, forStoppingServer: boolean, onConfirm: () => Promise<void>) {
		super(app);
		const { containerEl } = this;
		const { contentEl } = this;
		const { modalEl } = this;
		contentEl.empty();
		contentEl.style.alignItems = 'center';
		contentEl.style.textAlign = 'center';

		if (forStoppingServer) {
			containerEl.setAttribute('id', 'warningModal');
			modalEl.style.borderWidth = '2px';
			modalEl.style.borderColor = '#FFEEBA';
			modalEl.style.color = '#b88c25';
			// this.modalEl.style.background = '#ff7575';
			modalEl.style.backgroundColor = '#FFF3CD';
			const closeButton = modalEl.getElementsByClassName(`modal-close-button`)[0];
			closeButton.setAttribute('style', `color: #b88c25;`);
			const warningSVG = contentEl.createEl('div', {attr: {['style']: `text-align: center; font-weight: bold;`} });
			warningSVG.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#b88c25" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-alert-triangle"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>`;
		}
		contentEl.createEl('h2', { text: (!forStoppingServer)? 'Confirmation': 'WARNING', attr: {['style']: `text-align: center; font-weight: bold; margin-top: 0px;`} });
		contentEl.createEl('p').innerHTML = text;
		const buttonContainer = contentEl.createEl('div');
		buttonContainer.style.gap = '10px';
		buttonContainer.style.display = 'flex';
		buttonContainer.style.justifyContent = 'center';
		const confirmButton = buttonContainer.createEl('button', { text: 'OK', attr: {['style']: `width: 75px;`}});
		confirmButton.addEventListener('click', () => {
			onConfirm();
			this.close();
		});
		const cancelButton = buttonContainer.createEl('button', { text: 'Cancel', attr: {['style']: `width: 75px;`}});
		cancelButton.addEventListener('click', () => this.close());
		if (forStoppingServer) {
			confirmButton.style.backgroundColor = '#b88c25';
			cancelButton.style.backgroundColor = '#b88c25';
		}
	}
}


export class ServerRunningModal extends Modal {
	constructor(app: App, private plugin: CollabPlugin) {
		super(app);
	}

	onOpen() {
		super.onOpen();
		const { containerEl } = this;
		containerEl.empty();
		containerEl.setAttribute('id', 'serverModal');
		const modalBG = document.getElementsByClassName('modal-bg')[0];
		if (modalBG === containerEl.firstChild) {
			containerEl.removeChild(modalBG);
		}
		const serverEl = containerEl.createDiv({cls: 'modal', attr: {['style']: `width: 30%; overflow: hidden;`}});
		const topEl = serverEl.createEl('div', {attr: {['style']: `justify-content: center; align-items: center;`}});
		topEl.createEl('h2', { text: 'Server is Running', attr: {['style']: `margin: 0; text-align: center;`}});
		let hostport = `${this.plugin.settings.hostname}:${this.plugin.settings.port}`;
		topEl.createEl('p', { text: `Connect to `, attr: {['style']: `text-align: center; margin-bottom: 10px;`}})
			.createEl('a', {href : `http://${hostport}/`, text: `${hostport}`});
		const cloud_container = serverEl.createEl('div', {cls: 'cloud-container', attr: {['style']: `height: 80px; width: 80px;`}});
		cloud_container.createEl('div', {cls: 'cloud_float'});
		cloud_container.createEl('div', {cls: 'cloud_float_2'});
		cloud_container.createEl('div', {cls: 'cloud_float_3'});
		// serverEl.createEl('div', {cls: 'x2', attr:{['style']: `margin-right: 100%;`}}).createEl('div', {cls: `cloud`, attr: {['style']: `background: var(--interactive-accent)`}});
		const bottomEl = serverEl.createEl('div', {attr: {['style']: `text-align: center; justify-content: center; align-items: center;`}});
		// bottomEl.createEl('div', {attr: {['style']: `margin-bottom: 10px; justify-content: center; align-items: center;`}})
		// 	.createEl('div', {cls: `spinner`, attr: {['style']: `height: 60px; width: 60px; border-top: 6px solid var(--interactive-accent)`}});
		bottomEl.createEl('button', { cls: 'mod-warning', attr: {['style']: `width: 90px; text-wrap: wrap; justify-content: center; align-items: center;`}, text: 'Stop Server' })
			.addEventListener('click', () => {
				new ConfirmModal(app, `Are you sure you want to stop the server?<br><strong>Any new changes made on the browser will not be saved after stopping!!</strong>`, true, async () => {
					const state = await this.plugin.stopServer();
					new Notice(
						state ?
							'The Http server has stopped.'
							: 'There was a problem stopping the server, check logs for more info.'
					);
					console.log("Stopping server");
					this.close();
				}).open();
			});
	}

	onClose() {
		const { contentEl } = this;
		const { containerEl } = this;
		const { modalEl } = this;
		contentEl.remove();
		modalEl.remove();
		containerEl.remove();
	}
}
