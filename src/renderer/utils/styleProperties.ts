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
        translateTextSize(settings.textSize)
    )
    document.documentElement.style.setProperty(
        '--font-family',
        translateFontProperty(settings.fontName)
    )
}

const lerp = (a, b, t) => a + t * (b - a)

// CSS text size preference value must be between .7 and 2.5
// the settings value (from the widget and also in the settings file) is 0-100
function translateTextSize(val) {
    // make this exactly 1 (with the formula below, it ends up being 1.0999...)
    if (val == 20) {
        return 1
    }
    return lerp(0.7, 2.5, val / 100)
}

function translateFontProperty(val) {
    return `var(--font-${val})`
}
