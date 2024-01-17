import {App, Modal, Notice} from "obsidian";
import CollabPlugin from "../main";

export class ConfirmModal extends Modal {
	constructor(app: App, text: string, onConfirm: () => Promise<void>) {
		super(app);
		this.contentEl.style.alignItems = 'center';
		this.contentEl.style.textAlign = 'center';
		// this.modalEl.style.background = '#ff7575';
		this.contentEl.createEl('h2', { text: 'Confirmation' }).style.textAlign = 'center';
		this.contentEl.createEl('p', { text });
		this.contentEl.createEl('button', { text: 'OK' }).addEventListener('click', () => {
			onConfirm();
			this.close();
		});
		this.contentEl.createEl('button', { text: 'Cancel' }).addEventListener('click', () => this.close());
	}
}

export class ServerRunningModal extends Modal {
	public stayOpen: boolean;

	constructor(app: App, private plugin: CollabPlugin) {
		super(app);
		this.stayOpen = true;
	}

	onOpen() {
		super.onOpen();
		const { containerEl } = this;
		containerEl.empty();
		// containerEl.createDiv({cls: 'modal-bg', attr: {['style']: `opacity: 0.95;`}});  FIXME later, new modal keeps getting added on reload
		// containerEl.createDiv({cls: 'modal-bg'});
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
				new ConfirmModal(app, 'Are you sure you want to stop the server?', async () => {
					const state = await this.plugin.stopServer();
					new Notice(
						state ?
							'The Http server has stopped.'
							: 'There was a problem stopping the server, check logs for more info.'
					);
					this.confirmClose();
				}).open();
			});
	}

	confirmClose() {
		this.stayOpen = false;
		this.close();
	}

	onClose() {
		if (this.stayOpen) {
			this.open();
			return;
		}
		const { contentEl } = this;
		const { containerEl } = this;
		const { modalEl } = this;
		contentEl.remove();
		modalEl.remove();
		containerEl.remove();
	}
}
