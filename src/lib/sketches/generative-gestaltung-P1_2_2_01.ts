import type p5Type from 'p5';
import type { SketchParams } from './index';

// Hilfsfunktion: Sortiert Farben nach Helligkeit (als Beispiel)
function sortColors(colors: p5Type.Color[], mode: string | null, p5: p5Type) {
  if (!mode) return;
  if (mode === 'BRIGHTNESS') {
    colors.sort((a, b) => p5.brightness(a) - p5.brightness(b));
  } else if (mode === 'HUE') {
    colors.sort((a, b) => p5.hue(a) - p5.hue(b));
  } else if (mode === 'SATURATION') {
    colors.sort((a, b) => p5.saturation(a) - p5.saturation(b));
  } else if (mode === 'GRAYSCALE') {
    colors.sort((a, b) => p5.lightness(a) - p5.lightness(b));
  }
}

export function generativeGestaltungP1_2_2_01(params: SketchParams): (p5: p5Type, el: HTMLDivElement) => void {
  return (p5, el) => {
    let img: p5Type.Image;
    let colors: p5Type.Color[] = [];
    let sortMode: string | null = null;
    let tileCount = 10;
    let rectSize = 60;

    // Bild aus CMS laden, falls vorhanden (ab p5.js 2.0: async in setup)
    let imgLoaded = false;
    let imgError = false;
    let imgUrl = params.imageUrl || 'https://picsum.photos/600/600';
    if (!params.imageUrl) {
      console.warn('Kein Bild aus CMS gefunden, benutze Platzhalter:', imgUrl);
    } else {
      console.log('Bild-URL aus CMS:', imgUrl);
    }

    p5.setup = async () => {
      p5.createCanvas(el.offsetWidth, el.offsetHeight);
      p5.noCursor();
      p5.noStroke();
      try {
        img = await new Promise<p5Type.Image>((resolve, reject) => {
          p5.loadImage(
            imgUrl,
            (loadedImg) => {
              imgLoaded = true;
              console.log('Bild erfolgreich geladen:', imgUrl);
              resolve(loadedImg);
            },
            (err) => {
              imgError = true;
              console.error('Fehler beim Laden des Bildes:', imgUrl, err);
              reject(err);
            }
          );
        });
      } catch (e) {
        imgError = true;
      }
    };

    p5.draw = () => {
      if (imgError) {
        p5.background(255, 0, 0);
        p5.fill(255);
        p5.textAlign(p5.CENTER, p5.CENTER);
        p5.text('Fehler beim Laden des Bildes!', p5.width/2, p5.height/2);
        return;
      }
      if (!imgLoaded || !img || !img.width) {
        p5.background(220);
        p5.fill(0);
        p5.textAlign(p5.CENTER, p5.CENTER);
        p5.text('Bild wird geladen...', p5.width/2, p5.height/2);
        return;
      }
      tileCount = p5.floor(p5.width / Math.max(p5.mouseX, 5));
      rectSize = p5.width / tileCount;
      img.loadPixels();
      colors = [];
      for (let gridY = 0; gridY < tileCount; gridY++) {
        for (let gridX = 0; gridX < tileCount; gridX++) {
          const px = p5.int(gridX * rectSize);
          const py = p5.int(gridY * rectSize);
          const i = (py * img.width + px) * 4;
          const c = p5.color(
            img.pixels[i],
            img.pixels[i + 1],
            img.pixels[i + 2],
            img.pixels[i + 3]
          );
          colors.push(c);
        }
      }
      sortColors(colors, sortMode, p5);
      let i = 0;
      for (let gridY = 0; gridY < tileCount; gridY++) {
        for (let gridX = 0; gridX < tileCount; gridX++) {
          p5.fill(colors[i]);
          p5.rect(gridX * rectSize, gridY * rectSize, rectSize, rectSize);
          i++;
        }
      }
    };

    p5.keyReleased = () => {
      if (p5.key === 's' || p5.key === 'S') {
        p5.saveCanvas('generative-gestaltung-' + Date.now(), 'png');
      }
      if (p5.key === '5') sortMode = null;
      if (p5.key === '6') sortMode = 'HUE';
      if (p5.key === '7') sortMode = 'SATURATION';
      if (p5.key === '8') sortMode = 'BRIGHTNESS';
      if (p5.key === '9') sortMode = 'GRAYSCALE';
      // Bildwechsel (hier nur ein Bild als Platzhalter)
      if (p5.key === '1' || p5.key === '2' || p5.key === '3' || p5.key === '4') {
        img = p5.loadImage('https://picsum.photos/600/600?random=' + p5.key);
      }
    };
  };
}
