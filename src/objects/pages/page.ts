import CollabPlugin from "../../main";
import {App, MarkdownRenderer, TAbstractFile, TFile, Workspace} from "obsidian";
import {right} from "@popperjs/core";
import {FileSorter, Navigation, NavigationOrder} from "./navigationResolver";
import {CollabUser} from "../../server/controller";

export class Page {
	private head: PageHead;
	private body: PageBody;
	private scripts: PageScriptElement;
	private navigation: Navigation;
	private document?: Document;
	// private nonce: string;
	public viewType: string = "markdown";
	public source: TFile | null;
	private curWidth: number;

	constructor(private plugin: CollabPlugin, content: Buffer, path: string, referer: string, navigationOrder: NavigationOrder) {
		const vault = plugin.app.vault;
		this.source = plugin.app.metadataCache.getFirstLinkpathDest(path, referer);
		this.navigation = new Navigation(plugin.app, navigationOrder);
		this.head = new PageHead(vault.getName(), plugin.settings.faviconLink, '/.obsidian/plugins/obsidian-collab/app.css')
		this.body = new PageBody(plugin, plugin.app.workspace, content, navigationOrder);
		this.scripts = new PageScriptElement(plugin);
		this.curWidth = 250;
		// this.nonce = nonce;
		if (!this.source) return;
		this.document = document.implementation.createHTMLDocument(this.source.basename);
	}

	public async create(): Promise<Page | undefined> {
		if (!this.document) return this;
		let layout = this.generateWebpageLayout(this.contentElement);
	}

	public async getHTML(): Promise<string> {
		return `<!DOCTYPE html>\n` + this.document?.documentElement.outerHTML;
	}

	get contentElement(): HTMLDivElement {
		if (!this.document) return this.contentElement;
		if (this.viewType != "markdown") return this.document?.querySelector(`.view-content`) as HTMLDivElement;
		return this.document?.querySelector(".markdown-preview-view") as HTMLDivElement ?? this.document?.querySelector(".view-content");
	}

	private async getDocumentHTML(): Promise<Page | undefined> {
		if (!this.document) return this;
		let body = this.document.body;

		// let renderInfo = await MarkdownRenderer.render(this.)
		// let contentEl = renderInfo?.contentEl;
		// this.viewType = renderInfo?.viewType ?? "markdown";

		// if (!contentEl) return undefined;
		// if (MarkdownRenderer.checkCancelled()) return undefined;

		// if (this.viewType == "markdown") {
			// contentEl.classList.toggle("allow-fold-headings", this.plugin.settings.allowFoldingHeadings);
		// }

		// let outlinedImages : Downloadable[] = [];
		// if (this.plugin.settings.inlineImages) await this.inlineMedia();
		// else outlinedImages = await  this.exportMedia();

		// let mathStyleEl = document.createElement("style");
		// mathStyleEl.id = "MJX-CHTML-styles";
		// mathStyleEl.innerHTML = AssetHandler.mathStyles;
		// this.contentElement.prepend(mathStyleEl);
		//
		// let dependencies_temp = await AssetHandler.getDownloads();

		return this;
	}

	retrieveHTML() {
		return `<!DOCTYPE html><html lang="en">${this.head.retrieveHead()}${this.body.retrieveBodyHtml(this.plugin, false, this.createLeftNavBar(), this.createPageHeader(), this.createTitleContainer(this.source as TFile))}${this.scripts.retirevePageScripts(this.source)}`;
	}

	private generateWebpageLayout(content: HTMLElement): {container: HTMLElement, left: HTMLElement, right: HTMLElement, center: HTMLElement} {
		if (!this.document) return {container: content, left: content, right: content, center: content};
		/*
		- div.app-container

			- div.workspace             {"is-left-sidedock-open", "is-right-sidedock-open"}

				right or left ribbon from workspace (empty if on other side)
					If mod-left-split does not have "is-sidedock-collapsed" then has class="is-collapsed"

	RIBBON		- div.workspace-ribbon side-dock-ribbon mod-left       	{"is-collapsed"}

	DIRECTORY	- div.workspace-split mod-horizontal mod-left-split    	{"is-sidedock-collapsed"}
					- hr.workspace-resize-handle						{opacity: 1 if not collapsed}
					- div.workspace-tabs mod-top mod-top-left-space		{"mod-active"}
						- hr.workspace-leaf-resize-handle
						- div.workspace-tab-header-container
						- div.workspace-tab-container
				FILES		- div.workspace-leaf mod-active				{"mod-active" on selected, and style="display: none;" if not selected}
				SEARCH		- div.workspace-leaf
				BOOKMARKS	- div.workspace-leaf

					{ Add additional tabs here}

	WORKSPACE	- div.workspace-split mod-vertical mod-root

					selected tab has class "mod-active"
					left-most tab has class "mod-top-left-space"
					right-most tab has class "mod-top-right-space"

					- hr.workspace-leaf-resize-handle

					- div.workspace-tabs mod-top

	OUTLINE		- div.workspace-tabs mod-horizontal mod-right-split    	{"is-sidedock-collapsed"}
					- div.workspace-ribbon side-dock-ribbon mod-right

	RIBBON		- div.workspace-ribbon side-dock-ribbon mod-right      	{"is-collapsed"}

		*/

		let iconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon sidebar-left"><path d="M21 3H3C1.89543 3 1 3.89543 1 5V19C1 20.1046 1.89543 21 3 21H21C22.1046 21 23 20.1046 23 19V5C23 3.89543 22.1046 3 21 3Z"></path><path d="M10 4V20"></path><path d="M4 7H7"></path><path d="M4 10H7"></path><path d="M4 13H7"></path></svg>`;

		let pageContainer = this.document.createElement("div");
		let workspace = this.document.createElement("div");

		let leftSidebar = this.document.createElement("div");
		let leftSidebarResizeHandle = this.document.createElement("hr");
		let leftSidebarTab = this.createLeftNavBar();

		let leftContent = this.document.createElement("div");
		let leftGutter = this.document.createElement("div");
		let leftGutterIcon = this.document.createElement("div");

		let documentContainer = this.document.createElement("div");
		let rightSidebar = this.document.createElement("div");
		let rightSidebarContainer = this.document.createElement("div");
		let rightSidebarSizer = this.document.createElement("div");
		let rightSidebarContentPositioner = this.document.createElement("div");
		let rightContent = this.document.createElement("div");
		let rightGutter = this.document.createElement("div");
		let rightGutterIcon = this.document.createElement("div");

		pageContainer.setAttribute("class", "horizontal-main-container");
		workspace.setAttribute("class", "workspace");

		leftSidebar.setAttribute("class", "workspace-split mod-horizontal mod-left-split");
		leftSidebarResizeHandle.setAttribute("class", "workspace-leaf-resize-handle");
		leftSidebarTab.setAttribute("class", "workspace-tabs mod-top mod-top-left-space");


		leftContent.setAttribute("class","");
		leftGutter.setAttribute("class","");
		leftGutterIcon.setAttribute("class","");

		documentContainer.setAttribute("class","");

		rightSidebar.setAttribute("class", "workspace-split mod-horizontal mod-left-split");
		rightSidebarContainer.setAttribute("class", "workspace-tabs mod-top mod-top-left-space");
		rightSidebarSizer.setAttribute("class","");
		rightSidebarContentPositioner.setAttribute("class","");
		rightContent.setAttribute("class","");
		rightGutter.setAttribute("class","");
		rightGutterIcon.setAttribute("class","");

		pageContainer.appendChild(workspace);
		workspace.appendChild(leftSidebar);
		workspace.appendChild(documentContainer);
		workspace.appendChild(rightSidebar);

		return {container: pageContainer, left: leftContent, right: rightContent, center: documentContainer};
	}

	private createLeftNavBar() {
		if (!this.document) return this.contentElement;
		let filesSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-folder-closed"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"></path><path d="M2 10h20"></path></svg>`;
		let searchSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-search"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>`;
		let bookmarksSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-bookmark"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"></path></svg>`;

		let leftSidebar = this.document.createElement("div");
		let leftSidebarResizeHandle = this.document.createElement("hr");
		let leftSidebarEmptyState = this.document.createElement('div');
		let leftSidebarEmptyStateMuted = this.document.createElement('p');
		let leftSidebarNavHeader = this.createNavHeader();
		let leftSidebarNavFilesContainer = this.navigation.createNavigation(this.document, this.source as TFile);

		let leftSidebarContent = [leftSidebarNavHeader, leftSidebarNavFilesContainer];

		let FilesWorkspaceLeaf = this.createWorkspaceLeaf(leftSidebarContent);
		let FilesWorkspaceTabHeader = this.createWorkspaceTabHeader("Files", filesSVG, "file-explorer");

		// let SearchWorkspaceLeaf = this.createWorkspaceLeaf();
		// let SearchWorkspaceTabHeader = this.createWorkspaceTabHeader("Search", searchSVG, "search");
		//
		// let BookmarksWorkspaceLeaf = this.createWorkspaceLeaf();
		// let BookmarksWorkspaceTabHeader = this.createWorkspaceTabHeader("Search", bookmarksSVG, "bookmarks");

		// let leafs = [FilesWorkspaceLeaf, SearchWorkspaceLeaf, BookmarksWorkspaceLeaf];
		// let tabHeaders = [FilesWorkspaceTabHeader, SearchWorkspaceTabHeader, BookmarksWorkspaceTabHeader];
		let leafs = [FilesWorkspaceLeaf];
		let tabHeaders = [FilesWorkspaceTabHeader];
		let leftSidebarTab = this.createWorkspaceTab(tabHeaders, leafs);

		leftSidebar.setAttribute("class", "workspace-split mod-horizontal mod-left-split");
		leftSidebar.setAttribute("style", `width: ${this.curWidth}px`);
		leftSidebarResizeHandle.setAttribute("class", "workspace-leaf-resize-handle");
		leftSidebarEmptyState.setAttribute('class', 'workspace-sidedock-empty-state');
		leftSidebarEmptyState.setAttribute('style', 'display: none;');
		leftSidebarEmptyStateMuted.setAttribute('class', 'u-muted');
		leftSidebarTab.setAttribute("class", "workspace-tabs mod-top mod-top-left-space");

		leftSidebar.appendChild(leftSidebarResizeHandle);
		leftSidebar.appendChild(leftSidebarEmptyState);
		leftSidebarEmptyState.appendChild(leftSidebarEmptyStateMuted);
		leftSidebarEmptyStateMuted.innerText = 'The sidebar is empty, try dragging a tab here.';
		leftSidebar.appendChild(leftSidebarTab);

		return leftSidebar;
	}

	private createNavHeader() {
		if (!this.document) return this.contentElement;
		let leftSidebarNavHeader = this.document.createElement("div");
		let leftSidebarNavButtonsContainer = this.document.createElement("div");
		let NavButtonNewNote = this.document.createElement("div");
		let NavButtonNewFolder = this.document.createElement("div");
		let NavButtonChangeSort = this.document.createElement("div");
		let NavButtonCollapseAll = this.document.createElement("div");

		let newNoteSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-edit"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z"></path></svg>`;
		let newFolderSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-folder-plus"><path d="M12 10v6"></path><path d="M9 13h6"></path><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"></path></svg>`;
		let newChangeSortSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-sort-asc"><path d="m3 8 4-4 4 4"></path><path d="M7 4v16"></path><path d="M11 12h4"></path><path d="M11 16h7"></path><path d="M11 20h10"></path></svg>`;
		let newCollapseAllSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-chevrons-down-up"><path d="m7 20 5-5 5 5"></path><path d="m7 4 5 5 5-5"></path></svg>`;

		leftSidebarNavHeader.setAttribute("class", "nav-header");
		leftSidebarNavButtonsContainer.setAttribute("class", "nav-buttons-container");
		NavButtonNewNote.setAttribute("class", "clickable-icon nav-action-button");
		NavButtonNewFolder.setAttribute("class", "clickable-icon nav-action-button");
		NavButtonChangeSort.setAttribute("class", "clickable-icon nav-action-button");
		NavButtonCollapseAll.setAttribute("class", "clickable-icon nav-action-button");

		leftSidebarNavHeader.appendChild(leftSidebarNavButtonsContainer);
		leftSidebarNavButtonsContainer.appendChild(NavButtonNewNote);
		leftSidebarNavButtonsContainer.appendChild(NavButtonNewFolder);
		leftSidebarNavButtonsContainer.appendChild(NavButtonChangeSort);
		leftSidebarNavButtonsContainer.appendChild(NavButtonCollapseAll);

		NavButtonNewNote.ariaLabel = "New note";
		NavButtonNewNote.innerHTML = newNoteSVG;
		NavButtonNewFolder.ariaLabel = "New folder";
		NavButtonNewFolder.innerHTML = newFolderSVG;
		NavButtonChangeSort.ariaLabel = "Change sort order";
		NavButtonChangeSort.innerHTML = newChangeSortSVG;
		NavButtonCollapseAll.ariaLabel = "Collapse all";
		NavButtonCollapseAll.innerHTML = newCollapseAllSVG;

		return leftSidebarNavHeader;
	}

	private createWorkspaceTab(tabHeaderContent: HTMLElement[], workspaceLeaf: HTMLElement[]): HTMLDivElement {
		/*
			- div.workspace-tabs							{mod-top mod-top-left-space}
				- hr.workspace-leaf-resize-handle
				- div.workspace-tab-header-container
				- div.workspace-tab-container
					- div.workspace-leaf
						- hr.workspace-leaf-resize-handle
						- div.workspace-leaf-content		data-type="file-explorer"

		*/
		if (!this.document) return this.contentElement;
		let WorkspaceTab = this.document.createElement("div");
		let WorkspaceLeafResizeHandle = this.document.createElement("hr");
		let HeaderContainer = this.createWorkspaceTabHeaderContainer(tabHeaderContent);
		let TabContainer = this.document.createElement("div");

		WorkspaceTab.setAttribute("class", "workspace-tabs");
		WorkspaceLeafResizeHandle.setAttribute("class", "workspace-leaf-resize-handle");
		HeaderContainer.setAttribute("class", "workspace-tab-header-container");
		TabContainer.setAttribute("class", "workspace-tab-container");

		WorkspaceTab.appendChild(WorkspaceLeafResizeHandle);
		WorkspaceTab.appendChild(HeaderContainer);
		WorkspaceTab.appendChild(TabContainer);
		for (const leaf of workspaceLeaf) {
			TabContainer.appendChild(leaf);
		}
		return WorkspaceTab;
	}

	private createWorkspaceLeaf(leafContent: HTMLElement[]): HTMLDivElement {
		if (!this.document) return this.contentElement;
		let WorkspaceLeaf = this.document.createElement("div");
		let WorkspaceResizeHandle = this.document.createElement("hr");
		let WorkspaceLeafContent = this.document.createElement("div");

		WorkspaceLeaf.setAttribute("class","workspace-leaf");
		WorkspaceResizeHandle.setAttribute("class", "workspace-leaf-resize-handle");
		WorkspaceLeafContent.setAttribute("class","workspace-leaf-content");

		WorkspaceLeaf.appendChild(WorkspaceResizeHandle);
		WorkspaceLeaf.appendChild(WorkspaceLeafContent);
		for (const contentDiv of leafContent) {
			WorkspaceLeafContent.appendChild(contentDiv);
		}

		return WorkspaceLeaf;
	}

	private createWorkspaceTabHeaderContainer(tabHeader: HTMLElement[]) {
		/*
			- div.workspace-tab-header-container
				- div.workspace-tab-header-container-inner
					- div.workspace-tab-header
					...
				- div.workspace-tab-header-new-tab
				- div.workspace-tab-header-spacer
				- div.workspace-tab-header-tab-list

		*/
		if (!this.document) return this.contentElement;
		let newTabIcon = `<span class="clickable-icon" aria-label="New tab"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-plus"><path d="M5 12h14"></path><path d="M12 5v14"></path></svg></span>`;
		let Container = this.document.createElement("div");
		let ContainerInner = this.document.createElement("div");
		let NewTab = this.document.createElement("div");
		let Spacer = this.document.createElement("div");
		let TabList = this.document.createElement("div");

		Container.setAttribute("class", "workspace-tab-header-container");
		ContainerInner.setAttribute("class", "workspace-tab-header-container-inner");
		NewTab.setAttribute("class", "workspace-tab-header-new-tab");
		Spacer.setAttribute("class", "workspace-tab-header-spacer");
		TabList.setAttribute("class", "workspace-tab-header-tab-list");

		Container.appendChild(ContainerInner);
		ContainerInner.style.animationDuration = "250ms";
		for (const header of tabHeader) {
			ContainerInner.appendChild(header);
		}

		Container.appendChild(NewTab);
		NewTab.innerHTML = newTabIcon;
		Container.appendChild(Spacer);
		Container.appendChild(TabList); // TODO add tab-list icon?

		return Container;
	}

	private createWorkspaceTabHeader(innerTitle: string, iconSVG: string, dataType: string) {
		/*
			- div.workspace-tab-header							{"is-active"}
				- div.workspace-tab-header-inner
					- div.workspace-tab-header-inner-icon 		SVG icon
					- div.workspace-tab-header-inner-title
					- div.workspace-tab-header-status-container
					- div.workspace-tab-header-inner-close-button
		*/
		if (!this.document) return this.contentElement;
		let closeIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-x"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>`;
		let Header = this.document.createElement("div");
		let HeaderInner = this.document.createElement("div");
		let HeaderInnerIcon = this.document.createElement("div");
		let HeaderInnerTitle = this.document.createElement("div");
		let HeaderStatusContainer = this.document.createElement("div");
		let HeaderInnerCloseButton = this.document.createElement("div");

		Header.setAttribute("class", "workspace-tab-header");
		HeaderInner.setAttribute("class", "workspace-tab-header-inner");
		HeaderInnerIcon.setAttribute("class", "workspace-tab-header-inner-icon");
		HeaderInnerTitle.setAttribute("class", "workspace-tab-header-inner-title");
		HeaderStatusContainer.setAttribute("class", "workspace-tab-header-status-container");
		HeaderInnerCloseButton.setAttribute("class", "workspace-tab-header-inner-close-button");

		Header.appendChild(HeaderInner);
		Header.draggable = true;
		Header.ariaLabel = innerTitle;
		Header.setAttribute("data-tooltip-delay", "300");
		Header.setAttribute("data-type", dataType);

		HeaderInner.appendChild(HeaderInnerIcon);
		HeaderInnerIcon.innerHTML = iconSVG;
		HeaderInner.appendChild(HeaderInnerTitle);
		HeaderInnerTitle.title = innerTitle;
		HeaderInner.appendChild(HeaderStatusContainer);
		HeaderInner.appendChild(HeaderInnerCloseButton);
		HeaderInnerCloseButton.innerHTML = closeIconSVG;
		HeaderInnerCloseButton.ariaLabel = "Close";
		return Header;
	}

	private createPageHeader() {
		if (!this.document) return this.contentElement;
		const ToggleButtonSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon sidebar-right"><path d="M3 3H21C22.1046 3 23 3.89543 23 5V19C23 20.1046 22.1046 21 21 21H3C1.89543 21 1 20.1046 1 19V5C1 3.89543 1.89543 3 3 3Z"></path><path d="M14 4V20"></path><path d="M20 7H17"></path><path d="M20 10H17"></path><path d="M20 13H17"></path></svg>`;

		let HeaderContainer = this.document.createElement("div");
		let HeaderSpacer = this.document.createElement("div");
		let ActiveUsers = this.document.createElement("div");
		let ToggleButton = this.document.createElement("div");
		let ClickableIcon = this.document.createElement("div");

		HeaderContainer.setAttribute("class", "workspace-tab-header-container");
		HeaderContainer.setAttribute('style', 'padding-right: 10px');
		HeaderSpacer.setAttribute("class", "workspace-tab-header-spacer");
		ActiveUsers.setAttribute("class", "workspace-tab-header-tab-list workspace-user-list");

		ToggleButton.setAttribute("class", "mod-right");
		ToggleButton.ariaLabel = "";
		ToggleButton.setAttribute('style', 'display: flex; justify-content: center; app-region: no-drag; cursor: pointer');
		ToggleButton.setAttribute("data-tooltip-position", "left");
		ClickableIcon.setAttribute("class", "clickable-icon");

		HeaderContainer.appendChild(HeaderSpacer);
		HeaderContainer.appendChild(ActiveUsers);
		ActiveUsers.style.gap = '3px';

		HeaderContainer.appendChild(ToggleButton);
		ToggleButton.appendChild(ClickableIcon);
		ClickableIcon.innerHTML = ToggleButtonSVG;
		return HeaderContainer;
	}

	private createTitleContainer(file: TFile) {
		/*
		- div view-header-title-container mod-at-start mod-fade

			- div view-header-title-parent
				- div `view-header-breadcrumb
				- div `view-header-breadcrumb

			- div view-header-title							tabindex="-1" contenteditable="true" value = file.name
		*/
		if (!this.document) return this.contentElement;
		const TitleContainer = document.createElement('div');
		const TitleParent = document.createElement('div');
		const Title = document.createElement('div');

		TitleContainer.setAttribute('class', `view-header-title-container mod-at-start mod-fade`);
		TitleParent.setAttribute('class', `view-header-title-parent`);
		Title.setAttribute('class', `view-header-title`);

		TitleContainer.appendChild(TitleParent);
		let curParent = file.parent;
		while (curParent) {
			if (curParent.name != '') {
				const HeaderBreadCrumb = document.createElement('div');
				const HeaderBreadCrumbSeparator = document.createElement('div');
				HeaderBreadCrumb.setAttribute('class', `view-header-breadcrumb`);
				HeaderBreadCrumb.innerText = curParent.name;
				HeaderBreadCrumbSeparator.setAttribute('class', `view-header-breadcrumb-separator`);
				HeaderBreadCrumbSeparator.innerText = '/';
				TitleParent.appendChild(HeaderBreadCrumb);
				TitleParent.appendChild(HeaderBreadCrumbSeparator);
			}
			curParent = curParent.parent;
		}
		TitleContainer.appendChild(Title);
		Title.tabIndex = -1;
		Title.contentEditable = `true`;
		Title.innerText = file.basename;

		return TitleContainer;
	}
}

export class PageHead {
	title: string;
	favicon: string;
	css: string;

	constructor(title: string, favicon: string, css: string) {
		this.title = title;
		this.favicon = favicon;
		this.css = css;
	}

	retrieveHead() {
		return `<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
	<title>${this.title}</title>
	<link rel="shortcut icon" href="${this.favicon}">
	<link href="${this.css}" type="text/css" rel="stylesheet">
	<script src="https://cdn.socket.io/4.7.4/socket.io.min.js" integrity="sha384-Gr6Lu2Ajx28mzwyVR8CFkULdCU7kMlZ9UthllibdOSo6qAiN+yXNHqtgdTvFXMT4" crossorigin="anonymous"></script>
</head>`;
	}
}

export class PageBody {
	private workspaceRibbon: HTMLElement | null;
	private navMenu: Navigation;
	private markdown: Buffer;
	private workspaceModRoot: string;
	private modRightSplit: string;

	constructor(plugin: CollabPlugin, private workspace: Workspace, content: Buffer, navigationOrder: NavigationOrder) {
		// console.log(workspace.leftRibbon);
		this.workspaceRibbon = workspace.containerEl.querySelector(`div.workspace-ribbon.side-dock-ribbon.mod-left`);
		this.navMenu = new Navigation(plugin.app, navigationOrder);
		this.markdown = content;
		this.workspaceModRoot = ``;
		this.modRightSplit = ``;
	}

	retrieveBodyHtml(plugin: CollabPlugin, useTitlebar: boolean, leftSideDock: HTMLDivElement, pageHeader: HTMLDivElement, titleContainer: HTMLDivElement) {
		var tempDivElement = document.createElement('div');
		var tempPageHeader = document.createElement('div');
		var tempTitleContainer = document.createElement('div');
		tempDivElement.appendChild(leftSideDock);
		tempPageHeader.appendChild(pageHeader);
		tempTitleContainer.appendChild(titleContainer)
		let theme = `${document.body.classList.contains('theme-dark')? 'theme-dark' : 'theme-light'}`;
		let classString = `mod-windows is-frameless is-maximized is-hidden-frameless obsidian-app show-inline-title show-view-header`;
		return `<body class="${theme} ${classString}" style="--zoom-factor:1; --font-text-size:16px;">
	${(useTitlebar)? this.retrieveTitlebar(): ''}
	<div class="app-container">
		<div class="horizontal-main-container">
			<div class="workspace">
				<div class="workspace-ribbon side-dock-ribbon mod-left">
					${this.workspaceRibbon?.innerHTML}
				</div>
				${tempDivElement.innerHTML}
				<div class="workspace-split mod-vertical mod-root">
					<hr class="workspace-leaf-resize-handle">
					<div class="workspace-tabs mod-top mod-top-left-space mod-top-right-space">
						<hr class="workspace-leaf-resize-handle">
						${tempPageHeader.innerHTML}
						<div class="workspace-tab-container">
							<div class="workspace-leaf">
								<div class="workspace-leaf-content" data-type="markdown" data-mode="preview">
									<div class="view-header">
										${tempTitleContainer.innerHTML}
										<div class="view-actions">
											<a class="clickable-icon view-action mod-bookmark" aria-label="Bookmark">
												<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-bookmark">
													<path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"></path>
												</svg>
											</a>
											<a class="clickable-icon view-action" id="switch-button" title="reading" aria-label="Current view: readingClick to editCtrl+Click to open to the right" onclick="changeEditorMode()">
												<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-edit-3">
													<path d="M12 20h9"></path>
													<path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path>
												</svg>
											</a>
											<a class="clickable-icon view-action" aria-label="More options">
												<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-more-vertical">
													<circle cx="12" cy="12" r="1"></circle>
													<circle cx="12" cy="5" r="1"></circle>
													<circle cx="12" cy="19" r="1"></circle>
												</svg>
											</a>
										</div>
									</div>
									<div class="view-content">
										<div class="markdown-source-view cm-s-obsidian mod-cm6 is-live-preview is-folding show-properties node-insert-event" style="display: none;">
											<div aria-live="polite" style="position: fixed; top: -10000px;"></div>
											<div tabindex="-1" class="cm-scroller">
												<div class="cm-sizer">
													<div class="inline-title" contenteditable="true" spellcheck="true" autocapitalize="on" tabindex="-1" enterkeyhint="done">file1</div>
													<div class="metadata-container" tabindex="-1" data-property-count="0"><div class="metadata-properties-heading" tabindex="0"><div class="collapse-indicator collapse-icon"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon right-triangle"><path d="M3 8L12 17L21 8"></path></svg></div><div class="metadata-properties-title">Properties</div></div><div class="metadata-content"><div class="metadata-properties"></div><div class="metadata-add-button text-icon-button" tabindex="0"><span class="text-button-icon"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-plus"><path d="M5 12h14"></path><path d="M12 5v14"></path></svg></span><span class="text-button-label">Add property</span></div></div></div>
													<div class="cm-contentContainer">
														<div oninput="saveText()" spellcheck="true" autocorrect="on" autocapitalize="on" translate="no" contenteditable="true" class="cm-content cm-lineWrapping" role="textbox" aria-multiline="true" data-language="hypermd" style="width: 100%;">
															${this.markdown}
														</div>
													</div>
													<div class="embedded-backlinks" style="display: none;"></div>
												</div>
											</div>
										</div>
										<div class="markdown-reading-view" style="width: 100%; height: 100%;">
											<div class="markdown-preview-view markdown-rendered node-insert-event is-readable-line-width allow-fold-headings show-indentation-guide allow-fold-lists" tabindex="-1" style="tab-size: 4; height: 100% !important;">
												<div class="markdown-preview-sizer markdown-preview-section" style="min-height: calc(100% - var(--file-margins));">
													<div class="markdown-preview-pusher" style="width: 1px; height: 0.1px; margin-bottom: 0px;"></div>
													<div class="mod-header"></div>
													${this.markdown}
													<div class="mod-footer">
														<div class="embedded-backlinks" style="display: none;"></div>
													</div>
												</div>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</body>`
	}

	retrieveTitlebar() {
		return `<div class="titlebar">
	<div class="titlebar-inner">
		<div class="titlebar-text">Callouts - test-vault - Obsidian v1.5.3</div>
		<div class="titlebar-button-container mod-left">
			<div class="titlebar-button mod-logo">
				<svg viewBox="0 0 512 512" width="18" height="18" class="logo-full">
					<radialGradient id="logo-bottom-left" cx="0" cy="0" gradientTransform="matrix(-59 -225 150 -39 161.4 470)" gradientUnits="userSpaceOnUse" r="1"><stop offset="0" stop-color="#fff" stop-opacity=".4"></stop><stop offset="1" stop-opacity=".1"></stop></radialGradient>
					<radialGradient id="logo-top-right" cx="0" cy="0" gradientTransform="matrix(50 -379 280 37 360 374.2)" gradientUnits="userSpaceOnUse" r="1"><stop offset="0" stop-color="#fff" stop-opacity=".6"></stop><stop offset="1" stop-color="#fff" stop-opacity=".1"></stop></radialGradient>
					<radialGradient id="logo-top-left" cx="0" cy="0" gradientTransform="matrix(69 -319 218 47 175.4 307)" gradientUnits="userSpaceOnUse" r="1"><stop offset="0" stop-color="#fff" stop-opacity=".8"></stop><stop offset="1" stop-color="#fff" stop-opacity=".4"></stop></radialGradient>
					<radialGradient id="logo-bottom-right" cx="0" cy="0" gradientTransform="matrix(-96 -163 187 -111 335.3 512.2)" gradientUnits="userSpaceOnUse" r="1"><stop offset="0" stop-color="#fff" stop-opacity=".3"></stop><stop offset="1" stop-opacity=".3"></stop></radialGradient>
					<radialGradient id="logo-top-edge" cx="0" cy="0" gradientTransform="matrix(-36 166 -112 -24 310 128.2)" gradientUnits="userSpaceOnUse" r="1"><stop offset="0" stop-color="#fff" stop-opacity="0"></stop><stop offset="1" stop-color="#fff" stop-opacity=".2"></stop></radialGradient>
					<radialGradient id="logo-left-edge" cx="0" cy="0" gradientTransform="matrix(88 89 -190 187 111 220.2)" gradientUnits="userSpaceOnUse" r="1"><stop offset="0" stop-color="#fff" stop-opacity=".2"></stop><stop offset="1" stop-color="#fff" stop-opacity=".4"></stop></radialGradient>
					<radialGradient id="logo-bottom-edge" cx="0" cy="0" gradientTransform="matrix(9 130 -276 20 215 284)" gradientUnits="userSpaceOnUse" r="1"><stop offset="0" stop-color="#fff" stop-opacity=".2"></stop><stop offset="1" stop-color="#fff" stop-opacity=".3"></stop></radialGradient>
					<radialGradient id="logo-middle-edge" cx="0" cy="0" gradientTransform="matrix(-198 -104 327 -623 400 399.2)" gradientUnits="userSpaceOnUse" r="1"><stop offset="0" stop-color="#fff" stop-opacity=".2"></stop><stop offset=".5" stop-color="#fff" stop-opacity=".2"></stop><stop offset="1" stop-color="#fff" stop-opacity=".3"></stop></radialGradient>
					<clipPath id="clip"><path d="M.2.2h512v512H.2z"></path></clipPath>
					<g clip-path="url(#clip)">
						<path d="M382.3 475.6c-3.1 23.4-26 41.6-48.7 35.3-32.4-8.9-69.9-22.8-103.6-25.4l-51.7-4a34 34 0 0 1-22-10.2l-89-91.7a34 34 0 0 1-6.7-37.7s55-121 57.1-127.3c2-6.3 9.6-61.2 14-90.6 1.2-7.9 5-15 11-20.3L248 8.9a34.1 34.1 0 0 1 49.6 4.3L386 125.6a37 37 0 0 1 7.6 22.4c0 21.3 1.8 65 13.6 93.2 11.5 27.3 32.5 57 43.5 71.5a17.3 17.3 0 0 1 1.3 19.2 1494 1494 0 0 1-44.8 70.6c-15 22.3-21.9 49.9-25 73.1z" fill="#6c31e3"></path>
						<path d="M165.9 478.3c41.4-84 40.2-144.2 22.6-187-16.2-39.6-46.3-64.5-70-80-.6 2.3-1.3 4.4-2.2 6.5L60.6 342a34 34 0 0 0 6.6 37.7l89.1 91.7a34 34 0 0 0 9.6 7z" fill="url(#logo-bottom-left)"></path>
						<path d="M278.4 307.8c11.2 1.2 22.2 3.6 32.8 7.6 34 12.7 65 41.2 90.5 96.3 1.8-3.1 3.6-6.2 5.6-9.2a1536 1536 0 0 0 44.8-70.6 17 17 0 0 0-1.3-19.2c-11-14.6-32-44.2-43.5-71.5-11.8-28.2-13.5-72-13.6-93.2 0-8.1-2.6-16-7.6-22.4L297.6 13.2a34 34 0 0 0-1.5-1.7 96 96 0 0 1 2 54 198.3 198.3 0 0 1-17.6 41.3l-7.2 14.2a171 171 0 0 0-19.4 71c-1.2 29.4 4.8 66.4 24.5 115.8z" fill="url(#logo-top-right)"></path>
						<path d="M278.4 307.8c-19.7-49.4-25.8-86.4-24.5-115.9a171 171 0 0 1 19.4-71c2.3-4.8 4.8-9.5 7.2-14.1 7.1-13.9 14-27 17.6-41.4a96 96 0 0 0-2-54A34.1 34.1 0 0 0 248 9l-105.4 94.8a34.1 34.1 0 0 0-10.9 20.3l-12.8 85-.5 2.3c23.8 15.5 54 40.4 70.1 80a147 147 0 0 1 7.8 24.8c28-6.8 55.7-11 82.1-8.3z" fill="url(#logo-top-left)"></path>
						<path d="M333.6 511c22.7 6.2 45.6-12 48.7-35.4a187 187 0 0 1 19.4-63.9c-25.6-55-56.5-83.6-90.4-96.3-36-13.4-75.2-9-115 .7 8.9 40.4 3.6 93.3-30.4 162.2 4 1.8 8.1 3 12.5 3.3 0 0 24.4 2 53.6 4.1 29 2 72.4 17.1 101.6 25.2z" fill="url(#logo-bottom-right)"></path>
						<g clip-rule="evenodd" fill-rule="evenodd">
							<path d="M254.1 190c-1.3 29.2 2.4 62.8 22.1 112.1l-6.2-.5c-17.7-51.5-21.5-78-20.2-107.6a174.7 174.7 0 0 1 20.4-72c2.4-4.9 8-14.1 10.5-18.8 7.1-13.7 11.9-21 16-33.6 5.7-17.5 4.5-25.9 3.8-34.1 4.6 29.9-12.7 56-25.7 82.4a177.1 177.1 0 0 0-20.7 72z" fill="url(#logo-top-edge)"></path>
							<path d="M194.3 293.4c2.4 5.4 4.6 9.8 6 16.5L195 311c-2.1-7.8-3.8-13.4-6.8-20-17.8-42-46.3-63.6-69.7-79.5 28.2 15.2 57.2 39 75.7 81.9z" fill="url(#logo-left-edge)"></path>
							<path d="M200.6 315.1c9.8 46-1.2 104.2-33.6 160.9 27.1-56.2 40.2-110.1 29.3-160z" fill="url(#logo-bottom-edge)"></path>
							<path d="M312.5 311c53.1 19.9 73.6 63.6 88.9 100-19-38.1-45.2-80.3-90.8-96-34.8-11.8-64.1-10.4-114.3 1l-1.1-5c53.2-12.1 81-13.5 117.3 0z" fill="url(#logo-middle-edge)"></path>
						</g>
					</g>
				</svg>
				<svg viewBox="0 0 512 512" width="18" height="18" fill="none" stroke="currentColor" stroke-width="32" stroke-linecap="round" stroke-linejoin="round" class="logo-wireframe">
					<path d="M172.7 461.6c73.6-149.1 2.1-217-43.7-246.9m72 96.7c71.6-17.3 141-16.3 189.8 88.5m-114-96.3c-69.6-174 44.6-181 16.3-273.6m97.7 370c1.6-3 3.3-5.8 5.1-8.6 20-29.9 34.2-53.2 41.4-65.3a16 16 0 0 0-1.2-17.7 342.1 342.1 0 0 1-40.2-66.1c-10.9-26-12.5-66.5-12.6-86.2 0-7.4-2.4-14.7-7-20.6l-81.8-104a32 32 0 0 0-1.4-1.5m97.7 370a172.8 172.8 0 0 0-18 59c-2.9 21.5-24 38.4-45 32.6-30-8.3-64.5-21.1-95.7-23.5l-47.8-3.6c-7.7-.6-15-4-20.3-9.5l-82.3-84.8c-9-9.2-11.4-23-6.2-34.8 0 0 51-111.8 52.8-117.7l.7-3M293.1 30a31.5 31.5 0 0 0-44.4-2.3l-97.4 87.5c-5.4 5-9 11.5-10 18.8-3.7 24.5-9.7 68-12.3 80.7"></path>
				</svg>
			</div>
		</div>
		<div class="titlebar-button-container mod-right">
			<div class="titlebar-button mod-minimize" aria-label="Minimize">
				<svg aria-hidden="false" width="10" height="10" viewBox="0 0 12 12">
					<rect fill="currentColor" width="10" height="1" x="1" y="6"></rect>
				</svg>
			</div>
			<div class="titlebar-button mod-maximize" aria-label="Restore down">
				<svg aria-hidden="false" width="10" height="10" viewBox="0 0 12 12">
					<rect width="9" height="9" x="1.5" y="1.5" fill="none" stroke="currentColor"></rect>
				</svg>
			</div>
			<div class="titlebar-button mod-close" aria-label="Close window">
				<svg aria-hidden="false" width="10" height="10" viewBox="0 0 12 12">
					<polygon fill="currentColor" fill-rule="evenodd" points="11 1.576 6.583 6 11 10.424 10.424 11 6 6.583 1.576 11 1 10.424 5.417 6 1 1.576 1.576 1 6 5.417 10.424 1"></polygon>
				</svg>
			</div>
		</div>
	</div>
</div>`;
	}
}

export class PageScriptElement {
	private scripts: string;

	constructor(private plugin: CollabPlugin) {
		// console.log(workspace.leftRibbon);
		this.scripts = '';
	}

	// TODO Note to self
	// I'm thinking on the join event, I can just send the innerHTML contents of the header-tab-list, edit it and then send it back
	// 	and reassign the innerHTML to whatever change happened

	retirevePageScripts(file: TFile | null) {
		return `
<script type="text/javascript">
	const minSideNavWidth = 200; // Minimum width (Match obsidian's min-width)
	const toggleButton = document.querySelector(".sidebar-toggle-button");
    const switch_button = document.getElementById('switch-button');
   	const toggleNavFolder = document.querySelector('div.nav-folder.mod-root > div.tree-item-children.nav-folder-children');
	const source_view = document.querySelector("div.markdown-source-view");
	const reading_view = document.querySelector("div.markdown-reading-view");
	let updatedText = document.querySelector("div.cm-content");
    const pagePath = getFilePath();
    const socketIO = io();
    socketIO.emit('join', pagePath);
    
    function getFilePath() {
        const currentUrl = window.location.href;
		console.log(currentUrl);
        let pagePath = '';
        const pageParents = document.querySelector("div.view-header-title-container");
        const pageTitle = document.querySelector("div.view-header-title-container div.view-header-title");
        const breadcrumbs = pageParents.getElementsByClassName('view-header-breadcrumb');
        for (let i = 0; i < breadcrumbs.length; i++) {
            if (breadcrumbs[i].innerText === '') {continue;}
            pagePath += breadcrumbs[i].innerText;
            if (i < breadcrumbs.length) {
            	pagePath += '/';
            }
        }
        pagePath += pageTitle.innerText+'.md';
        console.log(pagePath);
        return pagePath;
    }
    
	function changeEditorMode() {
        let is_invisible = source_view.getAttribute('style');
        console.log("Attribute: ", is_invisible);
        if (is_invisible && is_invisible.toString() === 'display: none;') {
            switch_button.title = 'edit';
            switch_button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-book-open"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>';
        	source_view.setAttribute('style', 'width: 100%; height: 100%;');
        	reading_view.setAttribute('style', 'display: none;');
            const parsed = JSON.stringify({ type: 'update', url: '${file?.path}', text: updatedText});
        } else {
            switch_button.title = 'reading';
            switch_button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-edit-3"><path d="M12 20h9"></path><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path></svg>';
        	reading_view.setAttribute('style', 'width: 100%; height: 100%;');
        	source_view.setAttribute('style', 'display: none;');
        }
	}
    
    function saveText() {
    	updatedText = document.querySelector("div.cm-content").innerText;
    	// const data = {
        //     type: 'update',
        // 	url: '${file?.path}',
       	// 	text: updatedText
    	// };
        // console.log(data);
    	// socket.send(JSON.stringify(data));
	}
	
	document.addEventListener("DOMContentLoaded", function () {
        toggleButton.addEventListener('click', function () {
            let startNavWidth = 250;
            document.querySelector('div.workspace')?.classList.toggle('is-left-sidedock-open');
      		document.querySelector('div.workspace-ribbon').classList.toggle('is-collapsed');
            const workspace_split = document.querySelector('div.workspace-split');
            const is_sd_collapsed = (workspace_split.classList.toggle('is-sidedock-collapsed'));
            workspace_split.setAttribute('style', (is_sd_collapsed)? 'width: 0px; display: none;': 'width: '+startNavWidth+'px;');
        });
        
        toggleNavFolder.addEventListener('click', function (event) {
            const navFolderElement = event.target.closest('div.tree-item.nav-folder');
            navFolderElement.classList.toggle('is-collapsed');
            navFolderElement.querySelector('div.tree-item-icon')?.classList.toggle('is-collapsed');
        });
		
        const draggableHr = document.getElementsByClassName("workspace-leaf-resize-handle").item(0);
		let isResizing = false;
		draggableHr.addEventListener("mousedown", function (event) {
            isResizing = true;
            document.addEventListener("mousemove", handleMouseMove);
            document.addEventListener("mouseup", function () {
                isResizing = false;
                document.removeEventListener("mousemove", handleMouseMove);
            });
		});
        
        function handleMouseMove(event) {
            if (isResizing) {
                let newWidth = event.clientX-42;
                const maxSideNavWidth = window.innerWidth * 0.8;
                newWidth = Math.max(minSideNavWidth, Math.min(maxSideNavWidth, newWidth));
        		draggableHr.parentElement.style.width = newWidth + "px";
            }
        }
		
		socketIO.on('updatedUserList', (curUser, newPage, fileSubscriptions) => {
			console.log('---- UPDATEDUSERLIST ----');
            console.log(fileSubscriptions);
            console.log(fileSubscriptions[pagePath]);
            updateActiveUsersOnPageUI(fileSubscriptions[pagePath]);
            updateNavigationUsersUI(fileSubscriptions);
		});
        
        const activeUsersContainer = document.getElementsByClassName("workspace-user-list").item(0);
		function updateActiveUsersOnPageUI(users) {
			activeUsersContainer.innerHTML = ''; // Clear the previous content
			
			const maxDisplayUsers = 4;
		   	
			for (let i = 0; i < Math.min(users.length, maxDisplayUsers); i++) {
				const userCircle = createUserCircle(users[i], false);
				activeUsersContainer.appendChild(userCircle);
			}
		   	
			if (users.length > maxDisplayUsers) {
				const moreCircle = createMoreCircle(users.length - maxDisplayUsers);
				activeUsersContainer.appendChild(moreCircle);
			}
			console.log(activeUsersContainer);
		}
        
        function updateNavigationUsersUI(fileSubscriptions) {
            document.querySelectorAll('div.nav-file-users[data-path$=".md"]').forEach((file) => file.innerHTML = '');
            for (const filePath in fileSubscriptions) {
                console.log("key: "+filePath);
                console.log(fileSubscriptions[filePath]);
                const navFile = document.querySelector('div.nav-file-users[data-path="'+filePath+'"]');
                console.log(navFile);
                navFile.innerHTML = '';
                console.log("Looping over users");
                for (let i = 0; i < fileSubscriptions[filePath].length; i++) {
                    const user = fileSubscriptions[filePath][i];
                    const userCircle = createUserCircle(user, true);
                    navFile.appendChild(userCircle);
                    console.log(user);
                }
			}
        }
	   
		function createUserCircle(user, isFileNav) {
			const userItemContainer = document.createElement('div');
			const userCircle = document.createElement('div');
			const userSVG = '<svg width="25px" height="25px" viewBox="0 0 24.00 24.00" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="var(--interactive-accent)" stroke-width="0.00024000000000000003"><g id="SVGRepo_bgCarrier" stroke-width="0" transform="translate(2.040000000000001,2.040000000000001), scale(0.83)"><rect x="0" y="0" width="24.00" height="24.00" rx="12" fill="#ffffff" strokewidth="0"></rect></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round" stroke="#CCCCCC" stroke-width="0.43200000000000005"></g><g id="SVGRepo_iconCarrier"> <path opacity="0.5" d="M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" fill="var(--interactive-accent)"></path> <path d="M16.807 19.0112C15.4398 19.9504 13.7841 20.5 12 20.5C10.2159 20.5 8.56023 19.9503 7.193 19.0111C6.58915 18.5963 6.33109 17.8062 6.68219 17.1632C7.41001 15.8302 8.90973 15 12 15C15.0903 15 16.59 15.8303 17.3178 17.1632C17.6689 17.8062 17.4108 18.5964 16.807 19.0112Z" fill="var(--interactive-accent)"></path> <path d="M12 12C13.6569 12 15 10.6569 15 9C15 7.34315 13.6569 6 12 6C10.3432 6 9.00004 7.34315 9.00004 9C9.00004 10.6569 10.3432 12 12 12Z" fill="var(--interactive-accent)"></path> </g></svg>';
		    
			userCircle.setAttribute('class', 'user-circle');
			userCircle.style.position = 'relative';
			userCircle.style.display = 'inline flex';
			userCircle.style.borderRadius = '50%';
			userCircle.style.border = '2px solid';
		    
			userItemContainer.title = user.username;
            console.log('=========');
            console.log(user);
            console.log(userItemContainer.title);
            userItemContainer.style.display = 'flex';
            userItemContainer.style.cursor = 'pointer';
            if (!isFileNav) {
            	userItemContainer.style.justifyContent = 'center';
            }
			userItemContainer.appendChild(userCircle);
		   	
			userCircle.innerHTML = userSVG;
			userCircle.style.color = user.userColor;
		   	
			return userItemContainer;
		}
        
	   	function createMoreCircle(count) {
		   	const moreCircle = document.createElement('div');
			moreCircle.className = 'moreCircle';
			moreCircle.textContent = '+'+count.toString();
			moreCircle.title = 'Click to view more users';
			moreCircle.addEventListener('click', () => {
				// Implement logic to show a modal or expand the user list
				alert('List of all users: '+socketIO.rooms[pagePath]);
			});
			return moreCircle;
	   	}
    });
</script>`;
	}
}
