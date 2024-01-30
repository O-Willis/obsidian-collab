import {Vault, TAbstractFile, TFile, TFolder, App, WorkspaceItem} from 'obsidian';
import HtmlServerPlugin from "../../main";

export enum SortOrder { Ascending, Descending }
export enum SortType { FileName, ModifiedTime, CreatedTime }
export type NavigationOrder = { order: SortOrder, type: SortType};

let nav_folder_children_width = 17;

export class FileSorter {
	sortOrder: SortOrder;
	sortType: SortType;

	constructor(navOrder: NavigationOrder) {
		this.sortOrder = navOrder.order;
		this.sortType = navOrder.type;
  	}

  	getComparator(): (a: TFile, b: TFile) => number {
    	switch (this.sortType) {
			case SortType.FileName: return this.fileNameComparator.bind(this);
			case SortType.ModifiedTime: return this.modifiedTimeComparator.bind(this);
      		case SortType.CreatedTime: return this.createdTimeComparator.bind(this);
      		default: throw new Error('Invalid sort type');
    	}
  	}

  	fileNameComparator(a: TFile, b: TFile): number {
		const nameA = a.name.toUpperCase();
		const nameB = b.name.toUpperCase();
		if (nameA < nameB) {return this.sortOrder === SortOrder.Ascending ? -1 : 1;}
		else if (nameA > nameB) {return this.sortOrder === SortOrder.Ascending ? 1 : -1;}
		else {return 0;}
  	}

  	modifiedTimeComparator(a: TFile, b: TFile): number {
    	const timeA = a.stat.mtime;
    	const timeB = b.stat.mtime;
    	return this.sortOrder === SortOrder.Ascending ? timeA - timeB : timeB - timeA;
 	 }

  	createdTimeComparator(a: TFile, b: TFile): number {
		const timeA = a.stat.ctime;
		const timeB = b.stat.ctime;
		return this.sortOrder === SortOrder.Ascending ? timeA - timeB : timeB - timeA;
	}
}

export class Navigation {
	private vaultTitle: string;
  	private content: TAbstractFile[];
  	private fileSorter: FileSorter;
  	private htmlPayload: WorkspaceItem;
	private width: number;

  	constructor(app: App, navOrder: NavigationOrder) {
    	this.vaultTitle = app.vault.getName();
    	this.fileSorter = new FileSorter(navOrder);
    	this.content = this.getSortedContent(app.vault.getRoot().children);
    	this.htmlPayload = app.workspace.leftSplit.getRoot();
		this.width = 159;
    	// this.htmlPayload = app.workspace.leftSplit.containerEl.doc. as HTMLElement;
    	// console.log(app.workspace.leftSplit.containerEl.doc.scripts);
  	}

  	public getContent() {
		return this.content;
	}

	public createNavigation(document: Document | undefined, cur_file: TFile): HTMLDivElement {
		if (!document) return new HTMLDivElement();
		const NavFileContainer = document.createElement("div");
		const NavFileFolder = this.createNavFolder(document, cur_file, cur_file.vault.getRoot(), this.width, true);

		NavFileContainer.setAttribute('class', 'nav-files-container node-insert-event');
		NavFileContainer.setAttribute('style', 'position: relative;');

		NavFileContainer.appendChild(NavFileFolder);

		return NavFileContainer;
	}

	private createNavFolder(document: Document | undefined, cur_file: TFile, folder: TFolder, depth: number, isModRoot: boolean) {
		/*
		- div.tree-item nav-folder 													{"mod-root" for root or "is-collapsed"}
			- div.tree-item-self nav-folder-title									if NOT mod-root then {"is-clickable"} data-path={name} draggable="true"
																						style=""
				- div.tree-item-icon collapse-icon nav-folder-collapse-indicator 	{is-collapsed}
					- svg
				- div.tree-item-inner nav-folder-title-content						value = "name"

			- div.tree-item-children nav-folder-children							Obsidian has this removed with collapsed but I probably wont

		*/
		if (!document) return new HTMLDivElement();
		const collapsed_str = !(cur_file.path.includes(folder.name))? 'is-collapsed':'';
		const NavFolder = document.createElement("div");
		const NavFolderTitle = document.createElement("div");
		const NavFolderIcon = document.createElement("div");
		const NavFolderTitleContent = document.createElement("div");
		const NavFolderChildren = this.createNavChildren(document, cur_file, folder.children, depth);

		const arrowSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon right-triangle"><path d="M3 8L12 17L21 8"></path></svg>`;

		NavFolder.setAttribute('class', `tree-item nav-folder ${(isModRoot)? 'mod-root': collapsed_str}`);
		NavFolderTitle.setAttribute('class', `tree-item-self nav-folder-title ${(isModRoot)? '':'is-clickable'}`);
		NavFolderTitle.setAttribute('data-path', `${(isModRoot)? '/': folder.path}`);
		if (!isModRoot) {
			NavFolderTitle.draggable = true;
			NavFolderTitle.setAttribute('style', `margin-left: ${this.width - depth}px !important; padding-left: ${(depth - this.width)+24}px !important;`);
			NavFolderIcon.setAttribute('class', `tree-item-icon collapse-icon nav-folder-collapse-indicator ${collapsed_str}`);
		}

		NavFolderTitleContent.setAttribute('class', 'tree-item-inner nav-folder-title-content');

		NavFolder.appendChild(NavFolderTitle);
		NavFolder.appendChild(NavFolderChildren);
		if (!isModRoot) {
			NavFolderTitle.appendChild(NavFolderIcon);
			NavFolderIcon.innerHTML = arrowSVG;
		}
		NavFolderTitle.appendChild(NavFolderTitleContent);

		NavFolderTitleContent.innerText = folder.name;

		return NavFolder;
	}

	private createNavChildren(document: Document | undefined, cur_file: TFile, children: TAbstractFile[], depth: number) {
		if (!document) return new HTMLDivElement();
		const NavFolderChildren = document.createElement("div");
		const NavFolderChildrenWidth = document.createElement("div");

		NavFolderChildren.setAttribute('class', 'tree-item-children nav-folder-children');
		NavFolderChildrenWidth.setAttribute('style', `width: ${depth}px; height: 0.1px; margin-bottom: 0px;`);

		NavFolderChildren.appendChild(NavFolderChildrenWidth);
		let sorted_files: TFile[] = [];
		for (let child of children) {
			if (child instanceof TFolder) {
				NavFolderChildren.appendChild(this.createNavFolder(document, cur_file, child, depth+17, false));
			}
		}
		for (let child of children) {
			if (child instanceof TFile) {
				NavFolderChildren.appendChild(this.createNavFile(document, cur_file, child, depth+17));
			}
		}

		return NavFolderChildren;
	}

	private createNavFile(document: Document | undefined, selected_file: TFile, file: TFile, depth: number) {
		if (!document) return new HTMLDivElement();
		const NavFile = document.createElement("a");
		const NavFileTitle = document.createElement("div");
		const NavFileTitleContent = document.createElement("div");
		const NavFileTag = document.createElement("div");
		const NavFileUsersContainer = document.createElement("div");  // TODO stopped here
		const TreeItemChildren = document.createElement("div");

		NavFile.setAttribute('class', 'tree-item nav-file');
		NavFile.href = file.path;
		NavFile.setAttribute('style', 'display: block;');

		NavFileTitle.setAttribute('class', `tree-item-self is-clickable nav-file-title ${(file.path == selected_file.path)? 'is-active':''}`);
		NavFileTitle.setAttribute('data-path', `${file.path}`);
		NavFileTitle.draggable = true;
		NavFileTitle.setAttribute('style', `margin-left: ${this.width - depth}px !important; padding-left: ${(depth - this.width)+24}px !important;`);

		NavFileTitleContent.setAttribute('class', 'tree-item-inner nav-file-title-content');
		NavFileTag.setAttribute('class', 'nav-file-tag');
		NavFileUsersContainer.setAttribute('class', 'nav-file-users');
		NavFileUsersContainer.setAttribute('data-path', `${file.path}`);
		TreeItemChildren.setAttribute('class', 'tree-item-children');

		NavFile.appendChild(NavFileTitle);
		NavFileTitle.appendChild(NavFileTitleContent);
		NavFileTitleContent.innerText = file.basename;
		if (file.extension != 'md') {
			NavFileTitle.appendChild(NavFileTag);
		}
		NavFileTag.innerText = file.extension;
		NavFileTitle.appendChild(NavFileUsersContainer);
		NavFileUsersContainer.style.gap = '5px';
		NavFileUsersContainer.style.display = 'flex';
		NavFileUsersContainer.style.position = 'relative';
		NavFileUsersContainer.style.scale = '60%';
		NavFileUsersContainer.style.width = 'fit-content';
		NavFileUsersContainer.style.justifyContent = 'right';
		NavFileUsersContainer.style.margin = '-15px -30px auto 0px';
		NavFileUsersContainer.style.top = '8px';
		NavFile.appendChild(TreeItemChildren);

		return NavFile;
	}

  	private getSortedContent(content: TAbstractFile[]) {
    	let sorted_content: TAbstractFile[] = [];
    	const comparator = this.fileSorter.getComparator();
    	for (let item of content) {
    	  	if (item instanceof TFolder) {
    	    	sorted_content.push(item);
    	  	}
    	}
    	let root_files: TFile[] = [];
    	for (let item of content) {
    	  	if (item instanceof TFile) {
    	    	root_files.push(item)
    	  	}
    	}
    	root_files = root_files.slice().sort(comparator);
    	for (let file of root_files) {
    	  	sorted_content.push(file);
    	}
    	// console.log(sorted_content);
    	return sorted_content;
  	}
	// private createVaultTitle() {
	//   let treeItem = thi
	// }
}
