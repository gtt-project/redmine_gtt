/**
 * Interface for options used when creating a new instance of GttClient.
 */
export interface IGttClientOption {
  /**
   * Specifies the target HTML element for the map.
   */
  target: HTMLDivElement | null;
}

/**
 * Interface describing a layer object used in GttClient.
 */
export interface ILayerObject {
  /**
   * A unique identifier for the layer.
   */
  id: number;

  /**
   * The name of the layer.
   */
  name: string;

  /**
   * The type of the layer.
   */
  layer: string;

  /**
   * Additional options for configuring the layer.
   */
  layer_options: object;

  /**
   * The type of the source for the layer.
   */
  source: string;

  /**
   * Additional options for configuring the source.
   */
  source_options: object;

  /**
   * The format of the data for the layer.
   */
  format: string;

  /**
   * Additional options for configuring the format.
   */
  format_options: object;

  /**
   * Indicates whether the layer is a base layer.
   */
  baselayer: boolean;
}

/**
 * Interface for filtering options used in GttClient.
 */
export interface IFilterOption {
  /**
   * Specifies whether the location filter is enabled.
   */
  location: boolean;

  /**
   * Specifies whether the distance filter is enabled.
   */
  distance: boolean;
}
