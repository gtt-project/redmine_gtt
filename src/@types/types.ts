// types.ts
import { Tile, Image, VectorTile as VTLayer } from 'ol/layer';
import { OSM, XYZ, TileWMS, ImageWMS, VectorTile as VTSource } from 'ol/source';

export interface GttClientOption {
  target: HTMLDivElement | null;
}

export interface LayerObject {
  type: string;
  id: number;
  name: string;
  baselayer: boolean;
  options: object;
}

export interface FilterOption {
  location: boolean;
  distance: boolean;
}

export interface TileLayerSource {
  layer: typeof Tile;
  source: typeof OSM | typeof XYZ | typeof TileWMS;
  type: string;
}

export interface ImageLayerSource {
  layer: typeof Image;
  source: typeof ImageWMS;
  type: string;
}

export interface VTLayerSource {
  layer: typeof VTLayer;
  source: typeof VTSource;
  type: string;
}
