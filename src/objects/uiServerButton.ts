import {App, Notice, Setting} from 'obsidian';
import {ConfirmModal, ServerRunningModal} from './modals'
import CollabPlugin from "../main";

const addServerButton = (plugin: CollabPlugin) => {
	if (!plugin.settings.useRibbonButtons) {
		return () => {};
	}

	const startButton = plugin.addRibbonIcon(
		'cloud-off',
		'Turn the Http Server On',
		async (evt: MouseEvent) => {
			const activeLeaf = plugin.app.workspace.activeLeaf;
			if (activeLeaf) {
				console.log(activeLeaf);
				const view = activeLeaf.view;


				if (view.getViewType() === 'markdown') {
					const markdownView = view as any; // Cast to 'any' to access the file property
					const currentFile = markdownView.file;

					plugin.settings.recentFile = currentFile;
					console.log(`Most Recent File: ${currentFile.path}`);
					// If you want to do something more, like read the file's contents, you can use the Vault API
					// const fileContents = await plugin.app.vault.read(currentFile);
				}
			}
			new ConfirmModal(plugin.app, 'Are you sure you want to start the server?', false,async () => {
				const state = await plugin.startServer();
				new Notice(
					state ?
						'The Http server has started listening for connections.'
						: 'There was a problem starting the server, check logs for more info.'
				);
			}).open();
		}
	);

	const stopButton = plugin.addRibbonIcon(
		'cloud',
		'Turn the Http Server Off',
		() => {
			new ConfirmModal(plugin.app, `Are you sure you want to stop the server?<br>Any changes made on the browser will not be saved!`, true,async () => {
				const state = await plugin.stopServer();
				new Notice(
					state ?
						'The Http server has stopped.'
						: 'There was a problem stopping the server, check logs for more info.'
				);
			}).open();
		}
	);

	stopButton.classList.add('collab-ribbon-stop-button');

	const changeButtonState = ({isServerRunning,}: { isServerRunning: boolean; }) => {
		if (isServerRunning) {
			plugin.serverModal?.open();
			startButton.hide();
			stopButton.show();
		} else {
			plugin.serverModal?.close();
			startButton.show();
			stopButton.hide();
		}
	};

	plugin.app.workspace.on('collab-event', changeButtonState);

	changeButtonState({
		isServerRunning: !!plugin.serverController?.isRunning(),
	});

	const clearRibbonButton = () => {
		plugin.serverModal?.close();
		startButton.remove();
		stopButton.remove();
	}

	plugin.register(clearRibbonButton);

	return clearRibbonButton;
}

export const setupUiButton = (plugin: CollabPlugin) => {
	const clearRibbonButton = addServerButton(plugin);
	return { clearRibbonButton };
}
