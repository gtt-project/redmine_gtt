import { Tile, Image, VectorTile as VTLayer } from 'ol/layer';
import { OSM, XYZ, TileWMS, ImageWMS, VectorTile as VTSource } from 'ol/source';

// Interface for options used when creating a new instance of GttClient.
// Specifies the target HTML element for the map.
export interface IGttClientOption {
  target: HTMLDivElement | null;
}

// Interface describing a layer object used in GttClient.
// Contains information about the layer type, id, name, whether it's a base layer, and additional options.
export interface ILayerObject {
  type: string;
  id: number;
  name: string;
  baselayer: boolean;
  options: object;
}

// Interface for filtering options used in GttClient.
// Specifies whether location and distance filters are enabled.
export interface IFilterOption {
  location: boolean;
  distance: boolean;
}

// Interface for describing a tile layer source used in GttClient.
// Defines the layer and source types for tile-based layers (e.g., OSM, XYZ, WMS).
export interface ITileLayerSource {
  layer: typeof Tile;
  source: typeof OSM | typeof XYZ | typeof TileWMS;
  type: string;
}

// Interface for describing an image layer source used in GttClient.
// Defines the layer and source types for image-based layers (e.g., ImageWMS).
export interface IImageLayerSource {
  layer: typeof Image;
  source: typeof ImageWMS;
  type: string;
}

// Interface for describing a vector tile layer source used in GttClient.
// Defines the layer and source types for vector tile layers (e.g., VectorTile).
export interface IVTLayerSource {
  layer: typeof VTLayer;
  source: typeof VTSource;
  type: string;
}
