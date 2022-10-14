import { App, DropdownComponent, MarkdownView, Plugin, PluginSettingTab, Setting, WorkspaceLeaf } from 'obsidian';

interface DblClickTabPluginSettings {
	defaultDblClickTabBehavior: string;
}

const DEFAULT_SETTINGS: DblClickTabPluginSettings = {
	defaultDblClickTabBehavior: 'closeTab'
}

export default class DblClickTabPlugin extends Plugin {
	settings: DblClickTabPluginSettings;

	async onload() {
		await this.loadSettings();

		this.addSettingTab(new DblClickTabSettingTab(this.app, this));
		this.registerDomEvent(document, 'dblclick', this.dblClickTabBehavior.bind(this));
	}

	dblClickTabBehavior(evt: MouseEvent) {
		if (!app.workspace.activeLeaf) return;

		const activeLeaf = app.workspace.activeLeaf;
		const leaves: WorkspaceLeaf[] = [];
		switch (this.settings.defaultDblClickTabBehavior) {
			case 'closeTab':
				if (activeLeaf && (evt.target as HTMLElement).classList.contains("workspace-tab-header-inner-title")) {
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
				break;
			case 'splitTab':
				if (activeLeaf) {
					const state = activeLeaf.getViewState();
					if (!(state.type === "empty")) {
						app.workspace.duplicateLeaf(activeLeaf, "vertical");
					}
				}
				break;
			case 'renameTabFile':
				if (activeLeaf && activeLeaf.view instanceof MarkdownView) activeLeaf.setEphemeralState({ rename: "all" })
				break;
			default:
				break;
		}
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

		new Setting(containerEl)
			.setName('Default behavior when double clicking a tab')
			.setDesc("When you double click a tab title, it will trigger behavior. You can change that behavior here.")
			.addDropdown(async (drowdown: DropdownComponent) => {
				drowdown
					.addOption('closeTab', 'Close Tab')
					.addOption('renameTabFile', 'Rename File')
					.addOption('splitTab', 'Split Tab')
					.setValue(this.plugin.settings.defaultDblClickTabBehavior).onChange(async (value) => {
					this.plugin.settings.defaultDblClickTabBehavior = value;
					this.applySettingsUpdate();
				});
			});

		this.containerEl.createEl('h2', { text: 'Say Thank You' });

		new Setting(containerEl)
			.setName('Donate')
			.setDesc('If you like this plugin, consider donating to support continued development:')
			.addButton((bt) => {
				bt.buttonEl.outerHTML = `<a href="https://www.buymeacoffee.com/boninall"><img src="https://img.buymeacoffee.com/button-api/?text=Buy me a coffee&emoji=&slug=boninall&button_colour=6495ED&font_colour=ffffff&font_family=Inter&outline_colour=000000&coffee_colour=FFDD00"></a>`;
			});
	}
}
