import { gmodValues, type GmodField } from "./gmod";

type GmodValues = Record<GmodField, string>;
type GmodValueInput = string | number | null | undefined;
type GmodValueUpdates = Partial<Record<GmodField, GmodValueInput>>;
type GmodRender = (values: Readonly<GmodValues>) => string;
type GmodSubscriber = (values: Readonly<GmodValues>) => void;
type GmodTarget = string | Element | Element[];

let resolveGmodReady: (values: Readonly<GmodValues>) => void;

export const gmodReady = new Promise<Readonly<GmodValues>>((resolve) => {
	resolveGmodReady = resolve;
});

export interface GmodRuntime {
	attr: (target: GmodTarget, attributeName: string, render: GmodRender) => void;
	text: (target: GmodTarget, render: GmodRender) => void;
}

declare global {
	interface Window {
		__loadingMockMapImages?: Record<string, string>;
		gmod: GmodValues;
		setGmodText: (name: GmodField, value: string) => void;
		setGmodValues: (values: GmodValueUpdates) => void;
		setGmodProgress: (width: string) => void;
		updateGmodFileProgress: () => void;
		GameDetails: (
			servername: string,
			serverurl: string,
			mapname: string,
			maxplayers: number | string,
			steamid: string,
			gamemode: string,
			volume: number | string,
			lang: string,
			gamemodeNice?: string
		) => void;
		DownloadingFile: (file: string) => void;
		SetStatusChanged: (status: string) => void;
		SetFilesTotal: (total: number | string) => void;
		SetFilesNeeded: (needed: number | string) => void;
	}
}

function resolveElements(target: GmodTarget): HTMLElement[] {
	if (typeof target === "string") {
		return Array.from(document.querySelectorAll<HTMLElement>(target));
	}

	if (Array.isArray(target)) {
		return target.filter((element): element is HTMLElement => element instanceof HTMLElement);
	}

	return target instanceof HTMLElement ? [target] : [];
}

function isGmodField(name: string): name is GmodField {
	return Object.prototype.hasOwnProperty.call(gmodValues, name);
}

function gmodElements(name: GmodField): HTMLElement[] {
	return Array.from(document.querySelectorAll<HTMLElement>(`[data-gmod="${name}"]`));
}

export function initializeGmodLoading(): GmodRuntime {
	window.gmod = { ...gmodValues };
	const subscribers = new Set<GmodSubscriber>();

	function getValues() {
		return window.gmod;
	}

	function notifySubscribers() {
		subscribers.forEach(function (subscriber) {
			subscriber(getValues());
		});
	}

	function subscribe(subscriber: GmodSubscriber) {
		subscribers.add(subscriber);
		subscriber(getValues());

		return function unsubscribe() {
			subscribers.delete(subscriber);
		};
	}

	const runtime: GmodRuntime = {
		attr(target, attributeName, render) {
			subscribe(function (values) {
				resolveElements(target).forEach(function (element) {
					element.setAttribute(attributeName, render(values));
				});
			});
		},
		text(target, render) {
			subscribe(function (values) {
				resolveElements(target).forEach(function (element) {
					element.textContent = render(values);
				});
			});
		}
	};

	window.setGmodText = function setGmodText(name, value) {
		window.gmod[name] = value;
		notifySubscribers();
	};

	window.setGmodValues = function setGmodValues(values) {
		Object.entries(values).forEach(function ([name, value]) {
			if (isGmodField(name)) {
				window.setGmodText(name, String(value ?? ""));
			}
		});
	};

	window.setGmodProgress = function setGmodProgress(width) {
		window.gmod.progressBar = width;
		const progressBars = gmodElements("progressBar");

		progressBars.forEach(function (progressBar) {
			progressBar.style.width = width;
		});

		notifySubscribers();
	};

	window.updateGmodFileProgress = function updateGmodFileProgress() {
		const total = Number(window.gmod.filesTotal);
		const needed = Number(window.gmod.filesNeeded);

		if (!total || Number.isNaN(total) || Number.isNaN(needed)) {
			return;
		}

		const downloaded = Math.max(0, total - needed);
		const percent = Math.max(0.2, Math.min(100, (downloaded / total) * 100));

		window.setGmodText("filesDownloaded", String(downloaded));
		window.setGmodProgress(percent.toFixed(1) + "%");
	};

	window.GameDetails = function GameDetails(
		servername,
		serverurl,
		mapname,
		maxplayers,
		steamid,
		gamemode,
		volume,
		lang,
		gamemodeNice = ""
	) {
		window.setGmodValues({
			gamemode,
			gamemodeNice,
			lang,
			language: lang,
			mapname,
			maxplayers,
			servername,
			serverGamemode: gamemodeNice || gamemode,
			serverMap: mapname,
			serverName: servername,
			serverurl,
			steamid,
			volume
		});

		resolveGmodReady(window.gmod);

		const mockMapImages = window.__loadingMockMapImages || {};
		const mapImg = mockMapImages[mapname] || "asset://mapimage/" + mapname;
		const mapImages = gmodElements("mapImage");

		if (mapImages.length) {
			window.gmod.mapImage = mapImg;
			mapImages.forEach(function (mapImage) {
				mapImage.setAttribute("src", mapImg);
			});
		}

	};

	window.DownloadingFile = function DownloadingFile(file) {
		window.setGmodText("progressText", "Downloading " + file);
	};

	window.SetStatusChanged = function SetStatusChanged(status) {
		window.setGmodText("progressText", status);
	};

	window.SetFilesTotal = function SetFilesTotal(total) {
		window.setGmodText("filesTotal", String(total));
		window.updateGmodFileProgress();
	};

	window.SetFilesNeeded = function SetFilesNeeded(needed) {
		window.setGmodText("filesNeeded", String(needed));
		window.updateGmodFileProgress();
	};

	return runtime;
}
