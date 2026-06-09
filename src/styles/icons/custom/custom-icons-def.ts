import * as FontFaceObserver from 'fontfaceobserver';
import FontSymbol from 'ol-ext/style/FontSymbol';
import './custom-icons.woff2';

const iconMappings: { [key: string]: any } = {
  'lobsta': '\uf101',
  'park_bench': '\uf102',
  'lobsta_road': '\uf103',
  'waste': '\uf104'
};

const customIconsUrl = 'RAILS_ASSET_URL("custom-icons.woff2")';

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
