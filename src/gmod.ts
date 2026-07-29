export const gmodValues = {
	filesDownloaded: "0",
	filesNeeded: "0",
	filesTotal: "0",
	gamemode: "",
	gamemodeNice: "",
	lang: "",
	language: "",
	mapImage: "",
	mapname: "",
	maxplayers: "",
	progressBar: "0.2%",
	progressText: "",
	servername: "",
	serverGamemode: "",
	serverMap: "",
	serverName: "",
	serverurl: "",
	steamid: "",
	volume: ""
} as const;

export type GmodField = keyof typeof gmodValues;
