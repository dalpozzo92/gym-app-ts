/**
 * Converte un colore HEX in RGB (r, g, b)
 * @param hex stringa hex (es. #ffffff o #fff)
 * @returns stringa "r, g, b"
 */
export const hexToRgb = (hex: string): string | null => {
    let c: any;
    if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
        c = hex.substring(1).split('');
        if (c.length === 3) {
            c = [c[0], c[0], c[1], c[1], c[2], c[2]];
        }
        c = '0x' + c.join('');
        return [(c >> 16) & 255, (c >> 8) & 255, c & 255].join(', ');
    }
    return null;
}

/**
 * Calcola il colore di contrasto (bianco o nero) in base al colore di sfondo
 * @param hex colore di sfondo
 * @returns '#ffffff' o '#000000'
 */
export const getContrastColor = (hex: string): string => {
    const rgbString = hexToRgb(hex);
    if (!rgbString) return '#ffffff';

    const rgb = rgbString.split(',').map(Number);
    // Formula YIQ per il contrasto
    const yiq = ((rgb[0] * 299) + (rgb[1] * 587) + (rgb[2] * 114)) / 1000;
    return (yiq >= 128) ? '#000000' : '#ffffff';
}

/**
 * Scurisce un colore HEX di una certa percentuale
 * @param color hex color
 * @param percent percentuale (0-100)
 */
export const shadeColor = (color: string, percent: number): string => {
    let R = parseInt(color.substring(1, 3), 16);
    let G = parseInt(color.substring(3, 5), 16);
    let B = parseInt(color.substring(5, 7), 16);

    R = Math.floor(R * (100 - percent) / 100);
    G = Math.floor(G * (100 - percent) / 100);
    B = Math.floor(B * (100 - percent) / 100);

    R = (R < 255) ? R : 255;
    G = (G < 255) ? G : 255;
    B = (B < 255) ? B : 255;

    const RR = ((R.toString(16).length == 1) ? "0" + R.toString(16) : R.toString(16));
    const GG = ((G.toString(16).length == 1) ? "0" + G.toString(16) : G.toString(16));
    const BB = ((B.toString(16).length == 1) ? "0" + B.toString(16) : B.toString(16));

    return "#" + RR + GG + BB;
}

/**
 * Schiarisce un colore HEX di una certa percentuale
 * @param color hex color
 * @param percent percentuale (0-100)
 */
export const tintColor = (color: string, percent: number): string => {
    let R = parseInt(color.substring(1, 3), 16);
    let G = parseInt(color.substring(3, 5), 16);
    let B = parseInt(color.substring(5, 7), 16);

    R = Math.floor(R + (255 - R) * percent / 100);
    G = Math.floor(G + (255 - G) * percent / 100);
    B = Math.floor(B + (255 - B) * percent / 100);

    const RR = ((R.toString(16).length == 1) ? "0" + R.toString(16) : R.toString(16));
    const GG = ((G.toString(16).length == 1) ? "0" + G.toString(16) : G.toString(16));
    const BB = ((B.toString(16).length == 1) ? "0" + B.toString(16) : B.toString(16));

    return "#" + RR + GG + BB;
}
