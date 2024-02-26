'use strict';

io();
document.querySelector(".sidebar-toggle-button");
document.getElementById('switch-button');
document.querySelector('div.nav-folder.mod-root > div.tree-item-children.nav-folder-children');
document.querySelector("div.markdown-source-view");
document.querySelector("div.markdown-reading-view");
document.querySelector("div.cm-content");
getFilePath();

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

const editor = CodeMirror(document.querySelector("div.cm-editor"), {
	lineNumbers: true,
	mode: 'hypermd',
	theme: 'default',
	value: '',
});
editor.focus();
