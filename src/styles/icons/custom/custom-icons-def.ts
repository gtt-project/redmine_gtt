import FontSymbol from 'ol-ext/style/FontSymbol';

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

// Load the font. After FontFace.load() resolves and the face is added to
// document.fonts it is usable for canvas drawing; no extra observer needed
// (the former FontFaceObserver step could stall for its full timeout in
// headless browsers and delayed the first map render).
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
}).catch((error) => {
  console.error('Error loading font:', error);
});

export { fontPromise };
export default FontSymbol;
