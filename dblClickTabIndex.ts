import {
	addIcon,
	App,
	ButtonComponent,
	DropdownComponent,
	MarkdownView,
	Plugin,
	PluginSettingTab,
	setIcon,
	Setting,
	WorkspaceLeaf
} from 'obsidian';

interface DblClickTabPluginSettings {
	defaultDblClickTabBehavior: string;
	defaultDblClickTabOnNoTabsAreaBehavior: string;
	supportNoTabsArea: boolean;
}

const DEFAULT_SETTINGS: DblClickTabPluginSettings = {
	defaultDblClickTabBehavior: 'closeTab',
	defaultDblClickTabOnNoTabsAreaBehavior: 'createNewTab',
	supportNoTabsArea: false,
}

export default class DblClickTabPlugin extends Plugin {
	settings: DblClickTabPluginSettings;
	hovering: boolean;
	toolbarContainer: HTMLElement | null;

	async onload() {
		await this.loadSettings();

		this.registerIconList();

		this.addSettingTab(new DblClickTabSettingTab(this.app, this));
		this.registerDomEvent(document, 'dblclick', this.dblClickTabBehavior.bind(this));

		// Because the plugin only works above 0.16.0 so I think don't need check api version anymore
		this.app.workspace.on('window-open', (leaf) => {
			this.registerDomEvent(leaf.doc, 'dblclick', this.dblClickTabBehavior.bind(this));
		});
	}

	async dblClickTabBehavior(evt: MouseEvent) {
		if (!app.workspace.activeLeaf) return;

		const activeLeaf = app.workspace.activeLeaf;

		if (!(evt.target as HTMLElement).classList.contains("workspace-tab-header-inner-title") || !activeLeaf) return;
		// @ts-ignore
		const side = activeLeaf.getRoot().side;

		switch (this.settings.defaultDblClickTabBehavior) {
			case 'closeTab':
				if (!side) this.closeTab(activeLeaf);
				break;
			case 'smartTab':
				const state = activeLeaf.getViewState();
				if (state.type === "empty") {
					break;
				}
				if (!side && (evt.ctrlKey || evt.metaKey)) {
					const leaf = await app.workspace.duplicateLeaf(activeLeaf, "vertical");
					leaf.setEphemeralState({
						focus: true
					});
					break;
				}
				if (!side && (evt.altKey)) {
					const leaf = await app.workspace.duplicateLeaf(activeLeaf, "horizontal");
					leaf.setEphemeralState({
						focus: true
					});
					break;
				}
				if (evt.shiftKey && state.type == "markdown") {
					app.workspace.openPopoutLeaf().setViewState(state);
					activeLeaf.detach();
					break;
				}
				if (!side) this.closeTab(activeLeaf);
				break;
			case 'renameTabFile':
				if (activeLeaf.view instanceof MarkdownView) activeLeaf.setEphemeralState({ rename: "all" })
				break;
			default:
				break;
		}
	}

	closeTab(activeLeaf: WorkspaceLeaf) {
		const leaves: WorkspaceLeaf[] = [];

		app.workspace.iterateRootLeaves((leaf) => {
			if (leaf) leaves.push(leaf);
		});

		if (leaves.length > 1) activeLeaf.detach();
		else if (leaves.length === 1) {
			const state = activeLeaf.getViewState();
			if (!(state.type === "empty")) {
				activeLeaf.detach();
			}
		}
	}

	registerIconList() {
		addIcon('alipay', `<svg t="1668133260947" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="3767" width="100" height="100" fill="currentColor"><path d="M492.343 777.511c-67.093 32.018-144.129 51.939-227.552 32.27-83.424-19.678-142.626-73.023-132.453-171.512 10.192-98.496 115.478-132.461 202.07-132.461 86.622 0 250.938 56.122 250.938 56.122s13.807-30.937 27.222-66.307c13.405-35.365 17.21-63.785 17.21-63.785H279.869v-35.067h169.995v-67.087l-211.925 1.526v-44.218h211.925v-100.63h111.304v100.629H788.35v44.218l-227.181 1.524v62.511l187.584 1.526s-3.391 35.067-27.17 98.852c-23.755 63.783-46.061 96.312-46.061 96.312L960 685.279V243.2C960 144.231 879.769 64 780.8 64H243.2C144.231 64 64 144.231 64 243.2v537.6C64 879.769 144.231 960 243.2 960h537.6c82.487 0 151.773-55.806 172.624-131.668L625.21 672.744s-65.782 72.748-132.867 104.767z" p-id="3768"></path><path d="M297.978 559.871c-104.456 6.649-129.974 52.605-129.974 94.891s25.792 101.073 148.548 101.073c122.727 0 226.909-123.77 226.909-123.77s-141.057-78.842-245.483-72.194z" p-id="3769"></path></svg>`);
		addIcon('wechat', `<svg t="1668133215423" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2768" width="100" height="100" fill="currentColor"><path d="M857.6 0H165.888C74.24 0 0 74.24 0 166.4v691.2c0 92.16 74.24 166.4 165.888 166.4h692.224c91.648 0 165.888-74.24 165.888-166.4v-691.2c-0.512-92.16-74.752-166.4-166.4-166.4zM384 686.08c-38.4 0-69.632-7.68-108.544-15.872l-108.544 54.272 31.232-93.184c-77.824-54.272-123.904-123.904-123.904-209.92 0-147.968 139.776-264.192 310.784-264.192 152.576 0 286.208 93.184 312.832 218.112-10.24-1.024-19.456-1.536-30.208-1.536-147.456 0-264.192 110.08-264.192 245.76 0 22.528 3.584 44.544 9.728 65.024-9.728 1.024-19.456 1.536-29.184 1.536z m457.728 108.544l23.04 77.824-84.992-46.592c-31.232 7.68-62.464 15.872-93.184 15.872-147.968 0-264.192-100.864-264.192-225.28 0-123.904 116.224-225.28 264.192-225.28 139.776 0 263.68 101.376 263.68 225.28 0.512 69.632-46.08 131.584-108.544 178.176z" p-id="2769"></path><path d="M237.568 323.072c0 12.288 5.12 24.064 13.312 32.768 8.704 8.704 20.48 13.312 32.768 13.312 12.288 0 24.064-5.12 32.768-13.312 8.704-8.704 13.312-20.992 13.312-32.768 0-12.288-5.12-24.064-13.312-32.768-8.704-8.704-20.992-13.312-32.768-13.312-12.288 0-24.064 5.12-32.768 13.312-8.704 8.704-13.312 20.992-13.312 32.768zM462.336 323.072c0 12.288 5.12 24.064 13.312 32.768s20.992 13.312 32.768 13.312c12.288 0 24.064-5.12 32.768-13.312 8.704-8.704 13.312-20.992 13.312-32.768 0-12.288-5.12-24.064-13.312-32.768-8.704-8.704-20.992-13.312-32.768-13.312-12.288 0-24.064 5.12-32.768 13.312-8.192 8.704-13.312 20.992-13.312 32.768zM574.464 547.328c0 9.216 3.584 18.432 10.752 25.088 6.656 6.144 15.872 10.24 25.088 10.24s18.432-3.584 25.088-10.24c6.656-6.144 10.752-15.872 10.752-25.088s-3.584-18.432-10.752-25.088c-6.656-6.144-15.872-10.24-25.088-10.24s-18.432 3.584-25.088 10.24c-6.656 6.656-10.752 15.872-10.752 25.088zM737.28 547.328c0 9.216 3.584 18.432 10.752 25.088 6.656 6.144 15.872 10.24 25.088 10.24s18.432-3.584 25.088-10.24c6.656-6.144 10.752-15.872 10.752-25.088s-3.584-18.432-10.752-25.088c-6.656-6.144-15.872-10.24-25.088-10.24s-18.432 3.584-25.088 10.24c-6.656 6.656-10.752 15.872-10.752 25.088z" p-id="2770"></path></svg>`)
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class DblClickTabSettingTab extends PluginSettingTab {
	plugin: DblClickTabPlugin;
	private applyDebounceTimer: number = 0;

	constructor(app: App, plugin: DblClickTabPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	applySettingsUpdate() {
		clearTimeout(this.applyDebounceTimer);
		const plugin = this.plugin;
		this.applyDebounceTimer = window.setTimeout(() => {
			plugin.saveSettings();
		}, 100);
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl('h2', { text: 'Double Click Tab' });

		this.displayClickTabBehavior();

		this.containerEl.createEl('h2', { text: 'Say Thank You' });

		new Setting(containerEl)
			.setName('Donate')
			.setDesc('If you like this plugin, consider donating to support continued development:')
			.addButton((bt) => {
				this.addImageToButton(bt, 'https://cdn.jsdelivr.net/gh/Quorafind/.github@main/IMAGE/%E5%BE%AE%E4%BF%A1%E4%BB%98%E6%AC%BE%E7%A0%81.jpg', 'wechat');
			})
			.addButton((bt) => {
				this.addImageToButton(bt, 'https://cdn.jsdelivr.net/gh/Quorafind/.github@main/IMAGE/%E6%94%AF%E4%BB%98%E5%AE%9D%E4%BB%98%E6%AC%BE%E7%A0%81.jpg', 'alipay');
			})
			.addButton((bt) => {
				this.addImageToButton(bt, "https://www.buymeacoffee.com/Quorafind", "bmc", "https://img.buymeacoffee.com/button-api/?text=Coffee&emoji=&slug=boninall&button_colour=886ce4&font_colour=ffffff&font_family=Comic&outline_colour=000000&coffee_colour=FFDD00");
			});
	}

	displayClickTabBehavior(): void {
		new Setting(this.containerEl)
			.setName('Default behavior when double clicking a tab')
			.setDesc("When you double click a tab title, it will trigger different behavior. You can change that behavior here.")
			.addDropdown(async (drowdown: DropdownComponent) => {
				drowdown
					.addOption('closeTab', 'Close Tab')
					.addOption('renameTabFile', 'Rename File')
					.addOption('smartTab', 'Smart Tab')
					.setValue(this.plugin.settings.defaultDblClickTabBehavior).onChange(async (value) => {
					this.plugin.settings.defaultDblClickTabBehavior = value;
					this.applySettingsUpdate();
				});
			});

		new Setting(this.containerEl)
			.setName("Enable Click On No Tabs Area")
			.setDesc("Support click on no tabs area to create new tab or notes.")
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.supportNoTabsArea)
					.onChange((t) => {
						this.plugin.settings.supportNoTabsArea = t;
						this.applySettingsUpdate();
						// Force refresh
						this.display();
					});
			});

		if (!this.plugin.settings.supportNoTabsArea) return;

		new Setting(this.containerEl)
			.setName('Default behavior when double clicking no tabs area')
			.setDesc("When you double click no tabs area, it will trigger behavior. You can change that behavior here.")
			.addDropdown(async (drowdown: DropdownComponent) => {
				drowdown
					.addOption('createNewTab', 'New Tab')
					.addOption('createNewTabWithNote', 'New Tab With Note')
					.setValue(this.plugin.settings.defaultDblClickTabOnNoTabsAreaBehavior).onChange(async (value) => {
					this.plugin.settings.defaultDblClickTabOnNoTabsAreaBehavior = value;
					this.applySettingsUpdate();
				});
			});
	}

	addImageToButton(button: ButtonComponent, url: string, imageType: string, imageUrl?: string): void {
		const aTagEL = button.buttonEl.createEl('a', {
			href: url
		})
		button.buttonEl.addClass("dbl-donate-button");

		switch (imageType) {
			case "alipay":
				setIcon(aTagEL, "alipay", 16);
				break;
			case "wechat":
				setIcon(aTagEL, "wechat", 16);
				break;
			case "bmc":
				const favicon = document.createElement("img") as HTMLImageElement;
				if (imageUrl) favicon.src = imageUrl;
				aTagEL.appendChild(favicon);
				break;
			default:
				break;
		}

	}
}
