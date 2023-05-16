declare global {
  interface FontFaceSet {
    add(font: FontFace): void;
  }
}

export {}; // This ensures this file is treated as a module
