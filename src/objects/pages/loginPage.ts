import CollabPlugin from "../../main";

export class LoginPage {
	private plugin: CollabPlugin;
	private nonce: string;

	constructor(plugin: CollabPlugin, path: string, referer: string, nonce: string) {
		this.plugin = plugin;
		this.nonce = nonce;
	}

	retrieveHtml() {
		return `<!DOCTYPE html>
<html lang="en">
	<head>
		<meta charset="utf-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
		<title>Remote ${this.plugin.app.vault.getName()}</title>
		<link rel="shortcut icon" href="/obsidian.md/favicon.ico">
		<link href="/.obsidian/plugins/obsidian-collab/app.css" type="text/css" rel="stylesheet">
	</head>
	<body class="${document.body.classList.contains('theme-dark')? 'theme-dark' : 'theme-light'} mod-windows is-frameless is-maximized is-hidden-frameless obsidian-app show-inline-title show-view-header"
		style="--zoom-factor:1; --font-text-size:16px;">
		<div class="app-container">
			<div class="horizontal-main-container">
				<div class="workspace">
					<div class="workspace-split mod-vertical mod-root">
						<div class="workspace-tabs mod-top mod-top-left-space mod-top-right-space">
							<div class="workspace-tab-container">
								<div class="workspace-leaf">
									<div class="workspace-leaf-content" data-type="markdown" data-mode="preview">
										<div class="view-content">
											<div class="markdown-reading-view" style="width: 100%; height: 100%;">
												<div class="markdown-preview-view markdown-rendered node-insert-event is-readable-line-width allow-fold-headings show-indentation-guide allow-fold-lists" 
													tabindex="-1" style="tab-size: 4; height: 100% !important;">
													<div class="markdown-preview-sizer markdown-preview-section" style="min-height: calc(100% - var(--file-margins));">
														<div class="markdown-preview-pusher" style="width: 1px; height: 0.1px; margin-bottom: 0px;">
															<div class="mod-header"></div>
															<div class="prompt">
																<div class="html-form-container" style="width: 100%; display: grid; justify-content: center; padding-bottom: 22px;">
																	<h1>${this.plugin.app.vault.getName()}</h1>
																	<div class="html-login-form">
																		<div class="html-login-form-label"><label for="username">Username:</label></div>
																		<div class="setting-item-control">
																			<input placeholder="Username" id="username" type="text" name="username" spellcheck="false" autocomplete="off">
																		</div>
																		<br>
																		<div class="html-login-form-label"><label for="password">Password:</label></div>
																		<div class="setting-item-control">
																			<input placeholder="Password" id="password" type="password" name="password" spellcheck="false" autocomplete="off">
																		</div>
																		<input style="display: none;" id="redirectUrl" type="text" name="redirectUrl" spellcheck="false">
																		<br>
																		<span class="settings-error-element" hidden id="error"></span>
																		<div class="html-form-button"><button class="mod-cta" id="loginBtn">Login</button></div>
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
				</div>
			</div>
		</div>
	</body>
</html>`;
	}
}
