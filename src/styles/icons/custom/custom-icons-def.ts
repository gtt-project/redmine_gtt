import * as FontFaceObserver from 'fontfaceobserver';
import FontSymbol from 'ol-ext/style/FontSymbol';

const iconMappings: { [key: string]: any } = {
  'lobsta': '\uf101',
  'park_bench': '\uf102',
  'lobsta_road': '\uf103',
  'waste': '\uf104'
};

// Read the meta tag for custom-icons
const customIconsMeta = document.querySelector('meta[name="gtt-font-custom-icons"]');
const customIconsUrl = customIconsMeta ? customIconsMeta.getAttribute('content') : 'data:application/font-woff2;base64,'; // Provide a data URL for an empty font

// Dynamically create the @font-face rule
if (customIconsUrl) {
  // Remove the existing @font-face rule
  const styleSheets = document.styleSheets;
  for (let i = 0; i < styleSheets.length; i++) {
    const cssRules = styleSheets[i].cssRules || styleSheets[i].rules;
    for (let j = 0; j < cssRules.length; j++) {
      const rule = cssRules[j];
      if (rule instanceof CSSFontFaceRule && rule.style.fontFamily === 'custom-icons') {
        styleSheets[i].deleteRule(j);
        break;
      }
    }
  }

  const style = document.createElement('style');
  style.innerHTML = `
    @font-face {
      font-family: 'custom-icons';
      font-style: normal;
      font-weight: 400;
      font-display: block;
      src: url(${customIconsUrl}) format('woff2');
    }
  `;
  document.head.appendChild(style);
}

// Define the font face
let customFont: FontFace;
customFont = new FontFace('custom-icons', `url(${customIconsUrl})`);

// Load the font
const fontPromise = customFont.load().then((font) => {
  // Add the loaded font to the document
  document.fonts.add(font);

  // Add the definitions
  FontSymbol.addDefs(
    {
      font: 'custom-icons',
      name: 'Custom Icons',
      copyright: 'Apache-2.0',
      prefix: 'gtt',
    },
    iconMappings
  );

  // Create a FontFaceObserver instance
  const observer = new FontFaceObserver('custom-icons');

  // Use the observer to wait for the font to be loaded
  return observer.load();
}).catch((error) => {
  console.error('Error loading font:', error);
});

export { fontPromise };
export default FontSymbol;
