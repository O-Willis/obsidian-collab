import { EditorState, Extension } from "@codemirror/state";
import { EditorView, WidgetType } from "@codemirror/view";
import { basicSetup } from "@codemirror/basic-setup";
import { javascript } from "@codemirror/lang-javascript";

export class TaskListWidget extends WidgetType {
	constructor(readonly checked: boolean) {
		super();
	}

	toDOM() {
		let input = document.createElement("input");
		input.className = "task-list-item-checkbox";
		input.type = "checkbox";
		input.checked = this.checked;
		let label = document.createElement("label");
		label.className = "task-list-label";
		label.appendChild(input);
		return label;
	}

	static of(checked: boolean) {
		return {
			startState: () => ({ checked }),
			toDOM: () => new TaskListWidget(checked).toDOM(),
		};
	}
}
