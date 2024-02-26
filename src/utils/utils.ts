import {MarkdownView} from "obsidian";


export class Utils {
	static async delay(ms: number) {
		return new Promise( resolve => setTimeout(resolve, ms));
	}

	static async changeViewMode(view: MarkdownView, modeName: "preview" | "source") {
		//@ts-ignore
		const mode = view.modes[modeName];
		//@ts-ignore
		mode && await view.setMode(mode);
	}

	static async waitUntil(condition: () => boolean, timeout: number = 1000, interval: number = 100): Promise<boolean> {
		return new Promise((resolve, reject) => {
			let timer = 0;
			let intervalId = setInterval(() => {
				if (condition()) {
					clearInterval(intervalId);
					resolve(true);
				} else {
					timer += interval;
					if (timer >= timeout) {
						clearInterval(intervalId);
						resolve(false);
					}
				}
			}, interval);
		});
	}
}
