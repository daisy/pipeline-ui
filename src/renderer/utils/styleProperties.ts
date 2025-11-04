// set CSS properties based on the settings

import { ApplicationSettings } from "shared/types";

/* font options
    --font-system: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont;
    --font-luciole: "Luciole";
    --font-georgia: Georgia;
    --font-timesnewroman: "Times New Roman";
    --font-couriernew: "Courier New";
    --font-arial: Arial;
    --font-verdana: Verdana;
    --font-monospace: monospace;
*/
export function loadStyleProperties(settings: ApplicationSettings) {
    document.documentElement.style.setProperty(
        '--text-size-preference',
        `${settings.textSize / 100}`
    )
    document.documentElement.style.setProperty(
        '--font-family',
        `var(--font-${settings.fontName})`
    )
}

