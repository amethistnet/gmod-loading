import { initializeGmodLoading } from "./gmod-client";

const walkFaces = [":v", ":3", "x3", ":D", ":)", ":P", "XD", ":o", ">:3"];

const walkFaceInterval = 1000;
const backgroundSlideshowInterval = 3000;

function initializeWalkFace() {
	const walkFace = document.querySelector<HTMLElement>("[data-walk-face]");

	if (!walkFace) {
		return;
	}

	let index = 0;

	window.setInterval(() => {
		index = (index + 1) % walkFaces.length;
		walkFace.textContent = walkFaces[index];
	}, walkFaceInterval);
}

async function initializeBackgroundSlideshow() {
	const background = document.querySelector<HTMLImageElement>("[data-background-slideshow]") as HTMLImageElement;

	if (!background) {
		return;
	}

	try {
		const response = await fetch("/images-manifest.json");

		if (!response.ok) {
			throw new Error("Failed to fetch image manifest");
		}

		const images = await response.json() as unknown;

		if (!Array.isArray(images) || !images.every((image) => typeof image === "string") || !images.length) {
			return;
		}

		let index = Math.floor(Math.random() * images.length);

		function showNextBackground() {
			// @ts-ignore
			background.src = images[index];
			background.style.animation = "none";
			void background.offsetHeight;
			background.style.animation = "";
			// @ts-ignore
			index = (index + 1) % images.length;
		}

		showNextBackground();
		window.setInterval(showNextBackground, backgroundSlideshowInterval);
	} catch (error) {
		console.error("Error loading background images:", error);
	}
}

export function initializeLoadingPage() {
	const loading = initializeGmodLoading();

	loading.text("[data-server-name]", ({ serverName }) => serverName.toUpperCase());
	loading.text("[data-server-gamemode]", ({ serverGamemode }) => serverGamemode.toUpperCase());
	loading.text("[data-map-name]", ({ serverMap }) => serverMap.toUpperCase());
	loading.attr("[data-steam-avatar]", "src", ({ steamid }) => `https://unavatar.io/steam/profile:${steamid}`);

	initializeBackgroundSlideshow();
	initializeWalkFace();
}
