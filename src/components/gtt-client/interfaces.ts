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
  id: number;
  name: string;
  layer: string;
  layer_options: object;
  source: string;
  source_options: object;
  format: string;
  format_options: object;
  baselayer: boolean;
}

// Interface for filtering options used in GttClient.
// Specifies whether location and distance filters are enabled.
export interface IFilterOption {
  location: boolean;
  distance: boolean;
}
