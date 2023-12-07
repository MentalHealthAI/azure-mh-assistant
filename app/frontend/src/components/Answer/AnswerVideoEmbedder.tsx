import styles from "./Answer.module.css";
import Vimeo from "@vimeo/player";

export const transformVideoUrlsToEmbdedded = (
    str: string,
    iframeWidth: number,
    isVideoEnabled?: boolean,
    setIsPlayingVideo?: (isPlayingVideo: boolean) => void
): string => {
    const url = extractVimeoUrl(str);
    if (!url) {
        return str;
    } else if (!isVideoEnabled) {
        return str.replace(url, "");
    }

    const id = extractVimeoId(url);
    const height = (iframeWidth * 9) / 16; // keep 16 x 9 ratio.
    setIsPlayingVideo?.(true);

    // Make sure that playerContainer div is rendered before creating vimeo player
    setTimeout(() => {
        const playerContainer = document.getElementById("playerContainer");
        if (!playerContainer) {
            setIsPlayingVideo?.(false);
            return;
        }

        playerContainer.innerHTML = "";
        setTimeout(() => playerContainer.scrollIntoView(), 1000); // Make sure the player is rendered before focusing

        const player = new Vimeo("playerContainer", {
            url: url,
            autoplay: true,
            controls: false,
            dnt: true,
            height: height,
            title: false,
            width: iframeWidth
        });

        player.on("ended", () => {
            setIsPlayingVideo?.(false);
        });
    }, 1000);

    return str.replace(url, `<div id=playerContainer class="${styles.videoContainer}">טוען וידאו...</div>`);
};

const extractVimeoUrl = (str: string): string | undefined => {
    const vimeoUrlRegex = /https:\/\/player\.vimeo\.com\/video\/(\d+)/g;
    const urls = new Set<string>();
    let match;
    if ((match = vimeoUrlRegex.exec(str)) !== null) {
        return match[0];
    }

    return undefined;
};

const extractVimeoId = (url: string): string => {
    const vimeoBaseUrl = "https://player.vimeo.com/video/";
    if (url.startsWith(vimeoBaseUrl)) {
        const idPart = url.slice(vimeoBaseUrl.length);
        return idPart;
    }

    return "";
};
