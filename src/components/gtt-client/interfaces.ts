// types.ts
import { Tile, Image, VectorTile as VTLayer } from 'ol/layer';
import { OSM, XYZ, TileWMS, ImageWMS, VectorTile as VTSource } from 'ol/source';

// Interface for options used in creating a new instance of GttClient
export interface GttClientOption {
  target: HTMLDivElement | null;
}

// Interface describing a layer object used in GttClient
export interface LayerObject {
  type: string;
  id: number;
  name: string;
  baselayer: boolean;
  options: object;
}

// Interface for filtering options used in GttClient
export interface FilterOption {
  location: boolean;
  distance: boolean;
}

// Interface for describing a tile layer source used in GttClient
export interface TileLayerSource {
  layer: typeof Tile;
  source: typeof OSM | typeof XYZ | typeof TileWMS;
  type: string;
}

// Interface for describing an image layer source used in GttClient
export interface ImageLayerSource {
  layer: typeof Image;
  source: typeof ImageWMS;
  type: string;
}

// Interface for describing a vector tile layer source used in GttClient
export interface VTLayerSource {
  layer: typeof VTLayer;
  source: typeof VTSource;
  type: string;
}
