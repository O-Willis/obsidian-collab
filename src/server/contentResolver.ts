import CollabPlugin from "../main";
import mime from 'mime-types';
import {INTERNAL_CSS_ENPOINT, INTERNAL_LOGIN_ENPOINT} from "./pathResolver";
import {Auth, ReplaceableVariables} from "../settings/settings";
import {LoginForm} from "../objects/pages/loginForm";
import {Page, PageBody, PageHead} from "../objects/pages/page";
import {NavigationOrder, SortOrder, SortType} from "../objects/pages/navigationResolver";

export const contentResolver = async (
	path: string,
	referer: string,
	plugin: CollabPlugin,
	extraVars: ReplaceableVariables[] = [],
) => {
	console.log('Path: '+ path);
	if (path == INTERNAL_CSS_ENPOINT) {
		const fullCssText =
			Array.from(document.styleSheets)
				.flatMap((styleSheet) =>
					Array.from(styleSheet.cssRules).map((cssRule) => cssRule.cssText)
			)
				.join('\n') +
			`\n.markdown-preview-view, .markdown-embed-content {height: unset !important;}`;
		return {
			contentType: 'text/css',
			payload: fullCssText,
		};
	}
	if (path == INTERNAL_LOGIN_ENPOINT) {  // TODO DONT FORGET NONCE
		let nonce = extraVars[1].varValue;
		// const loginForm = new Page(plugin, path, referer, nonce).retrieveHTML();
		let loginForm: string = '';
		if (plugin.settings.useAuthentication == Auth.None) {
			loginForm = new LoginForm(plugin, path, referer, nonce).usernameLogin();
		} else {
			loginForm = new LoginForm(plugin, path, referer, nonce).retrieveHtml();
		}
		// console.log(plugin.settings.useAuthentication);
		// console.log(loginForm);
// 		const loginForm = `<!DOCTYPE html>
// <html lang="en">
// <head>
//   <meta charset="utf-8">
//   <meta name="viewport"
//     content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
//   <title>Remote ${plugin.app.vault.getName()}</title>
//   <link rel="shortcut icon" href="/obsidian.md/favicon.ico">
//   <link href="/.obsidian/plugins/obsidian-collab/app.css" type="text/css" rel="stylesheet">
// </head>
// <body class="${document.body.classList.contains('theme-dark')? 'theme-dark' : 'theme-light'} mod-windows is-frameless is-maximized is-hidden-frameless obsidian-app show-inline-title show-view-header"
//   style="--zoom-factor:1; --font-text-size:16px;">
//   <div class="app-container">
//     <div class="horizontal-main-container">
//       <div class="workspace">
//         <div class="workspace-split mod-vertical mod-root">
//           <div class="workspace-tabs mod-top mod-top-left-space mod-top-right-space">
//             <div class="workspace-tab-container">
//               <div class="workspace-leaf">
//                 <div class="workspace-leaf-content" data-type="markdown" data-mode="preview">
//                   <div class="view-content">
//                     <div class="markdown-reading-view" style="width: 100%; height: 100%;">
//                       <div class="markdown-preview-view markdown-rendered node-insert-event is-readable-line-width allow-fold-headings show-indentation-guide allow-fold-lists"
//                         tabindex="-1" style="tab-size: 4; height: 100% !important;">
//                         <div class="markdown-preview-sizer markdown-preview-section" style="min-height: calc(100% - var(--file-margins) - var(--file-margins));">
//                           <div class="markdown-preview-pusher" style="width: 1px; height: 0.1px; margin-bottom: 0px;"></div>
//                           <div class="mod-header"></div>
//                           <div class="prompt">
//                             <div class="html-form-container">
//                               <h1>${plugin.app.vault.getName()}</h1>
//                               <div class="html-login-form">
//                                 <div class="html-login-form-label"><label for="username">Username:</label></div>
//                                 <div class="setting-item-control">
//                                   <input placeholder="Username" id="username" type="text" name="username" spellcheck="false">
//                                 </div>
//                                 <br>
//                                 <div class="html-login-form-label"><label for="password">Password:</label></div>
//                                 <div class="setting-item-control">
//                                   <input placeholder="Password" id="password" type="password" name="password" spellcheck="false">
//                                 </div>
//                                 <input style="display: none;" id="redirectUrl" type="text" name="redirectUrl" spellcheck="false">
//                                 <br>
//                                 <span class="settings-error-element" hidden id="error"></span>
//                                 <div class="html-form-button">
//                                   <button class="mod-cta" id="loginBtn">Login</button>
//                                 </div>
//                               </div>
//                             </div>
//                           </div>
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   </div>
//   <script nonce="${nonce}" type="text/javascript">
//     function test() {
//       try {
//
//         const username = document.getElementById('username').value;
//         const password = document.getElementById('password').value;
//         if(!username || !password) {
//           error.innerText = 'You need to fill the Username and Password fields.';
//           error.hidden = false;
//           return;
//         }
//         var xhttp = new XMLHttpRequest();
//         xhttp.onreadystatechange = function() {
//           if (this.readyState == 4 && this.status == 200) {
//             window.location = redirectUrl.value;
//           } else {
//             error.innerText = 'Worng credentials.';
//             error.hidden = false;
//           }
//         };
//         xhttp.open("POST", "/login", true);
//         xhttp.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
//
//         xhttp.send(\`username=\${encodeURIComponent(username)}&password=\${encodeURIComponent(password)}\`);
//       }
//       catch (err){
//         error.innerText = 'Something went wrong.';
//         error.hidden = false;
//         console.error(err);
//       }
//     }
//
//     loginBtn.addEventListener('click',test);
//
//   </script>
// </body>
// </html>
// `;
		return {
			contentType: 'text/css',
			payload: loginForm,
		};
	}

	const file = plugin.app.metadataCache.getFirstLinkpathDest(path, referer);
	if (!file) return null;
	console.log(file.path, file.name);

	const payload = await plugin.app.vault.readBinary(file);

	if (file.extension === 'md') {
		// let nonce = extraVars[1].varValue;
		// let page: Page = new Page(plugin, path, referer);
		// const pageHead = new PageHead(plugin.app.vault.getName(), plugin.settings.faviconLink, INTERNAL_CSS_ENPOINT);
		// const pageBody = new PageBody(plugin, plugin.app.workspace, ``, Buffer.from(payload));
		const navigationDefault: NavigationOrder = {order: SortOrder.Descending, type: SortType.FileName};
		const page = new Page(plugin, Buffer.from(payload), path, referer, navigationDefault);
		console.log('Found a .md file');
		return {
			contentType: 'text/html',
			payload: page.retrieveHTML(),
		};
// 		return {
// 			contentType: 'text/html',
// 			payload: `<div class="App">
// <p>Welcome to the editor!</p>
// <select id="editor-mode" onchange="changeEditorMode()">
//     <option value="reading">Reading View</option>
//     <option value="editing">Editing View</option>
//     <option value="source">Source Mode</option>
// </select>
// <!--      <div class="tab-button-container">-->
// <!--        <button title="HTML">HTML</button>-->
// <!--        <button title="CSS">CSS</button>-->
// <!--        <button title="JavaScript">JavaScript</button>-->
// <!--      </div>-->
// 	<div class="editor-container">
// 	</div>
// </div>
// <div id="html-editor" oninput="saveText()" style="border: 2px solid #adadad; margin-left: 20px; max-width: 600px">
// 	${Buffer.from(payload)}
// </div>
// <script>
// 	const split = 'ws://${plugin.settings.hostname.replace('http', 'ws')}'+':${plugin.settings.port}';
// 	console.log("split: ",split);
// 	const socket = new WebSocket(split);
//     socket.addEventListener('open', (event) => {
//             console.log("WebSocket message received ", event);
//     });
//
//     socket.onmessage = (event) => {
//         console.log('Socket onmessage event!');
//         // Update the HTML container with new content
//         document.getElementById('html-editor').innerHTML = event.data;
//         console.log(event.data);
//     };
//
//     function changeEditorMode() {
//         var modeDropdown = document.getElementById("editor-mode");
//         var selectedMode = modeDropdown.options[modeDropdown.selectedIndex].value;
//
//         // Enable or disable contenteditable based on selected mode
//         var htmlEditor = document.getElementById("html-editor");
//         htmlEditor.contentEditable = (selectedMode === "editing" || selectedMode === "source");
//         console.log(htmlEditor.contentEditable);
//     }
//
//     function saveText() {
//         const updatedText = document.getElementById('html-editor').innerHTML;
//         const data = {
//             url: '${file.path}',
//             text: updatedText
//         };
//         socket.send(JSON.stringify(data));
//     }
//
// </script>`,
// 		};
	}

	return {
		contentType: mime.lookup(file.extension) || 'text',
		payload: Buffer.from(payload)
	};
};
