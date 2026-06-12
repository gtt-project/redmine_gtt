import { Controller } from '@hotwired/stimulus';

import { listLayerSchemas } from '../components/gtt-client/layers/registry';
// Side-effect import: registers the built-in layer factories and their schemas.
import '../components/gtt-client/layers/factories';
import type { LayerOptionField, LayerTypeSchema } from '../components/gtt-client/layers/schema';

/**
 * Example configurations offered in the advanced (OpenLayers classes) mode.
 */
const ADVANCED_EXAMPLES = [
  {
    name: 'OSM Tiles',
    layer: 'Tile',
    layer_options: {},
    source: 'OSM',
    source_options: {
      url: 'https://tile.openstreetmap.jp/{z}/{x}/{y}.png',
      crossOrigin: null,
      attributions:
        '<a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap contributors</a>',
    },
    format: '',
    format_options: {},
  },
  {
    name: 'OSM Vector Tiles',
    layer: 'VectorTile',
    layer_options: {
      styleUrl: 'https://tile.openstreetmap.jp/styles/osm-bright-ja/style.json',
      declutter: true,
    },
    source: 'VectorTile',
    source_options: {
      attributions:
        '<a href="https://www.openmaptiles.org/" target="_blank">OpenMapTiles</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap contributors</a>',
    },
    format: 'MVT',
    format_options: {},
  },
  {
    name: 'Google Maps',
    layer: 'WebGLTile',
    layer_options: {},
    source: 'Google',
    source_options: {
      key: 'YOUR_API_KEY',
      mapType: 'roadmap',
      language: 'ja_JP',
      scale: 'scaleFactor2x',
      layerTypes: ['layerTraffic'],
    },
    format: '',
    format_options: {},
  },
];

/** Which source classes are available per layer class (advanced mode). */
const SOURCES_BY_LAYER: Record<string, string[]> = {
  Image: ['ImageStatic', 'ImageWMS', 'Raster'],
  Tile: ['BingMaps', 'CartoDB', 'OSM', 'TileJSON', 'TileWMS', 'UTFGrid', 'WMTS', 'XYZ'],
  MapboxVector: [],
  Vector: ['Vector'],
  VectorTile: ['VectorTile'],
  WebGLTile: ['Google'],
};

/** Which format classes are available per source class (advanced mode). */
const FORMATS_BY_SOURCE: Record<string, string[]> = {
  Vector: ['GeoJSON', 'GPX', 'KML', 'WFS', 'WKB', 'WKT'],
  VectorTile: ['MVT', 'TopoJSON'],
};

function parseJsonObject(text: string | null | undefined): Record<string, any> {
  if (!text) return {};
  try {
    const parsed = JSON.parse(text);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

/**
 * Map-layer admin form: a type selector switches between schema-driven
 * fields for the named layer types (from the layer factory registry) and the
 * advanced OpenLayers-classes form. Schema field values are serialized into
 * the layer_options_string textarea on submit, so the server-side model
 * persists them without any new plumbing.
 */
export default class LayerFormController extends Controller<HTMLElement> {
  static targets = ['type', 'schemaFields', 'advanced', 'examples'];
  static values = {
    currentType: { type: String, default: '' },
    advancedLabel: { type: String, default: 'Advanced (OpenLayers classes)' },
  };

  declare readonly typeTarget: HTMLSelectElement;
  declare readonly schemaFieldsTarget: HTMLDivElement;
  declare readonly advancedTarget: HTMLDivElement;
  declare readonly examplesTarget: HTMLElement;
  declare readonly hasExamplesTarget: boolean;
  declare currentTypeValue: string;
  declare advancedLabelValue: string;

  private schemas: LayerTypeSchema[] = [];

  // Bound handlers kept as fields so disconnect() can remove exactly what
  // connect() added; a reconnect (AJAX re-render) must not stack listeners.
  private readonly handleTypeChange = (): void => this.onTypeChange();
  private readonly handleLayerChange = (): void => this.updateSourceOptions();
  private readonly handleSourceChange = (): void => this.updateFormatOptions();
  private readonly handleSubmit = (): void => this.onSubmit();

  connect(): void {
    this.schemas = listLayerSchemas();
    this.populateTypeSelect();
    this.typeTarget.addEventListener('change', this.handleTypeChange);

    this.layerSelect?.addEventListener('change', this.handleLayerChange);
    this.sourceSelect?.addEventListener('change', this.handleSourceChange);
    this.appendExampleLinks();

    this.element.closest('form')?.addEventListener('submit', this.handleSubmit);

    this.onTypeChange();
    this.updateSourceOptions();
  }

  disconnect(): void {
    this.typeTarget.removeEventListener('change', this.handleTypeChange);
    this.layerSelect?.removeEventListener('change', this.handleLayerChange);
    this.sourceSelect?.removeEventListener('change', this.handleSourceChange);
    this.element.closest('form')?.removeEventListener('submit', this.handleSubmit);
  }

  // --- element accessors -------------------------------------------------

  private get layerSelect(): HTMLSelectElement | null {
    return this.advancedTarget.querySelector<HTMLSelectElement>('#map_layer_layer');
  }

  private get sourceSelect(): HTMLSelectElement | null {
    return this.advancedTarget.querySelector<HTMLSelectElement>('#map_layer_source');
  }

  private get formatSelect(): HTMLSelectElement | null {
    return this.advancedTarget.querySelector<HTMLSelectElement>('#map_layer_format');
  }

  private textArea(id: string): HTMLTextAreaElement | null {
    return this.element.querySelector<HTMLTextAreaElement>(`#${id}`);
  }

  // --- type switching ----------------------------------------------------

  private populateTypeSelect(): void {
    this.typeTarget.innerHTML = '';
    for (const schema of this.schemas) {
      const option = document.createElement('option');
      option.value = schema.type;
      option.textContent = schema.label;
      this.typeTarget.appendChild(option);
    }
    const advanced = document.createElement('option');
    advanced.value = '';
    advanced.textContent = this.advancedLabelValue;
    this.typeTarget.appendChild(advanced);

    this.typeTarget.value = this.currentTypeValue;
    if (this.typeTarget.value !== this.currentTypeValue) {
      // Unknown stored type (e.g. registered by a removed extension):
      // fall back to the advanced form rather than silently picking a type.
      this.typeTarget.value = '';
    }
  }

  private onTypeChange(): void {
    const type = this.typeTarget.value;
    const schema = this.schemas.find((s) => s.type === type);
    if (schema) {
      this.renderSchemaFields(schema);
      this.schemaFieldsTarget.style.display = '';
      this.advancedTarget.style.display = 'none';
      // A hidden required control would block native form validation.
      this.layerSelect?.removeAttribute('required');
    } else {
      this.schemaFieldsTarget.innerHTML = '';
      this.schemaFieldsTarget.style.display = 'none';
      this.advancedTarget.style.display = '';
      this.layerSelect?.setAttribute('required', 'required');
    }
  }

  // --- schema-driven fields ----------------------------------------------

  private renderSchemaFields(schema: LayerTypeSchema): void {
    const values = parseJsonObject(this.textArea('map_layer_layer_options_string')?.value);
    this.schemaFieldsTarget.innerHTML = '';

    for (const field of schema.options) {
      const p = document.createElement('p');
      const label = document.createElement('label');
      label.textContent = field.label;
      label.htmlFor = `gtt_layer_option_${field.name}`;
      p.appendChild(label);
      p.appendChild(this.buildInput(field, values[field.name]));
      if (field.help) {
        const em = document.createElement('em');
        em.className = 'info';
        em.textContent = field.help;
        p.appendChild(em);
      }
      this.schemaFieldsTarget.appendChild(p);
    }
  }

  private buildInput(field: LayerOptionField, value: any): HTMLElement {
    // No name attribute on purpose: schema fields are serialized into the
    // layer_options_string textarea on submit instead of submitting directly.
    if (field.type === 'boolean') {
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.id = `gtt_layer_option_${field.name}`;
      input.dataset.optionName = field.name;
      input.dataset.optionType = field.type;
      input.checked = value ?? field.default === true;
      return input;
    }
    if (field.type === 'json') {
      const textarea = document.createElement('textarea');
      textarea.id = `gtt_layer_option_${field.name}`;
      textarea.dataset.optionName = field.name;
      textarea.dataset.optionType = field.type;
      textarea.rows = 4;
      textarea.cols = 60;
      if (field.required) textarea.required = true;
      textarea.value = value !== undefined ? JSON.stringify(value, null, 2) : '';
      return textarea;
    }
    const input = document.createElement('input');
    // URL templates like .../{z}/{x}/{y}.png trip native type="url"
    // validation in some browsers, so url options use a plain text input.
    input.type = field.type === 'number' ? 'number' : 'text';
    if (field.type === 'number') input.step = 'any';
    input.id = `gtt_layer_option_${field.name}`;
    input.dataset.optionName = field.name;
    input.dataset.optionType = field.type;
    input.size = 60;
    if (field.required) input.required = true;
    input.value = value ?? (field.default !== undefined ? String(field.default) : '');
    return input;
  }

  private collectSchemaValues(): Record<string, any> {
    const values: Record<string, any> = {};
    const inputs = this.schemaFieldsTarget.querySelectorAll<HTMLElement>('[data-option-name]');
    inputs.forEach((el) => {
      const name = el.dataset.optionName as string;
      const type = el.dataset.optionType;
      if (type === 'boolean') {
        values[name] = (el as HTMLInputElement).checked;
      } else if (type === 'json') {
        const parsed = parseJsonObject((el as HTMLTextAreaElement).value);
        if (Object.keys(parsed).length > 0) values[name] = parsed;
      } else if (type === 'number') {
        const raw = (el as HTMLInputElement).value.trim();
        if (raw !== '' && !Number.isNaN(Number(raw))) values[name] = Number(raw);
      } else {
        const raw = (el as HTMLInputElement).value.trim();
        if (raw !== '') values[name] = raw;
      }
    });
    return values;
  }

  private onSubmit(): void {
    if (!this.typeTarget.value) return;

    // Named type: persist the schema fields as layer_options and clear the
    // OpenLayers class columns so the stored row only reflects this type.
    const layerOptions = this.textArea('map_layer_layer_options_string');
    if (layerOptions) {
      layerOptions.value = JSON.stringify(this.collectSchemaValues(), null, 2);
    }
    if (this.layerSelect) this.layerSelect.value = '';
    if (this.sourceSelect) this.sourceSelect.value = '';
    if (this.formatSelect) this.formatSelect.value = '';
    const sourceOptions = this.textArea('map_layer_source_options_string');
    if (sourceOptions) sourceOptions.value = '{}';
    const formatOptions = this.textArea('map_layer_format_options_string');
    if (formatOptions) formatOptions.value = '{}';

    // The dependent-select logic may have disabled some of these controls,
    // and disabled controls are not submitted; re-enable them so the cleared
    // values actually reach the server.
    [this.sourceSelect, this.formatSelect, sourceOptions, formatOptions].forEach((el) => {
      if (el) el.disabled = false;
    });
  }

  // --- advanced mode: dependent selects (ported from the old inline script)

  private updateSourceOptions(): void {
    const layerSelect = this.layerSelect;
    const sourceSelect = this.sourceSelect;
    if (!layerSelect || !sourceSelect) return;

    const available = SOURCES_BY_LAYER[layerSelect.value] || [];
    let autoSelect: HTMLOptionElement | null = null;

    for (const option of Array.from(sourceSelect.options)) {
      if (available.includes(option.value)) {
        option.style.display = 'block';
        if (!autoSelect) autoSelect = option;
      } else {
        option.style.display = 'none';
      }
    }

    if (autoSelect && (sourceSelect.value === '' || !available.includes(sourceSelect.value))) {
      sourceSelect.value = autoSelect.value;
    } else if (!autoSelect) {
      sourceSelect.value = '';
      const sourceOptions = this.textArea('map_layer_source_options_string');
      // '{}' rather than '': the server parses this column as JSON, and the
      // textarea may be re-enabled later by another layer choice.
      if (sourceOptions) sourceOptions.value = '{}';
    }

    sourceSelect.disabled = available.length === 0;
    const sourceOptionsArea = this.textArea('map_layer_source_options_string');
    if (sourceOptionsArea) sourceOptionsArea.disabled = sourceSelect.disabled;

    this.updateFormatOptions();
  }

  private updateFormatOptions(): void {
    const sourceSelect = this.sourceSelect;
    const formatSelect = this.formatSelect;
    if (!sourceSelect || !formatSelect) return;

    const available = FORMATS_BY_SOURCE[sourceSelect.value] || [];
    let autoSelect: HTMLOptionElement | null = null;

    for (const option of Array.from(formatSelect.options)) {
      if (available.includes(option.value)) {
        option.style.display = 'block';
        if (!autoSelect) autoSelect = option;
      } else {
        option.style.display = 'none';
      }
    }

    if (autoSelect && (formatSelect.value === '' || !available.includes(formatSelect.value))) {
      formatSelect.value = autoSelect.value;
    } else if (!autoSelect) {
      formatSelect.value = '';
      const formatOptions = this.textArea('map_layer_format_options_string');
      // '{}' rather than '': see updateSourceOptions.
      if (formatOptions) formatOptions.value = '{}';
    }

    formatSelect.disabled = available.length === 0;
    const formatOptionsArea = this.textArea('map_layer_format_options_string');
    if (formatOptionsArea) formatOptionsArea.disabled = formatSelect.disabled;
  }

  // --- advanced mode: example links ---------------------------------------

  private appendExampleLinks(): void {
    if (!this.hasExamplesTarget) return;

    ADVANCED_EXAMPLES.forEach((item) => {
      const link = document.createElement('a');
      link.href = '#';
      link.textContent = item.name;
      link.addEventListener('click', (event) => {
        event.preventDefault();
        this.applyExample(item);
      });
      this.examplesTarget.appendChild(link);
      this.examplesTarget.appendChild(document.createTextNode(', '));
    });
  }

  private applyExample(item: (typeof ADVANCED_EXAMPLES)[number]): void {
    // Examples configure the advanced form, so switch to it first.
    this.typeTarget.value = '';
    this.onTypeChange();

    const nameInput = this.element.querySelector<HTMLInputElement>('#map_layer_name');
    if (nameInput) nameInput.value = item.name;
    if (this.layerSelect) this.layerSelect.value = item.layer;
    if (this.sourceSelect) this.sourceSelect.value = item.source;
    if (this.formatSelect) this.formatSelect.value = item.format;

    const layerOptions = this.textArea('map_layer_layer_options_string');
    if (layerOptions) layerOptions.value = JSON.stringify(item.layer_options, null, 2);
    const sourceOptions = this.textArea('map_layer_source_options_string');
    if (sourceOptions) sourceOptions.value = JSON.stringify(item.source_options, null, 2);
    const formatOptions = this.textArea('map_layer_format_options_string');
    if (formatOptions) formatOptions.value = JSON.stringify(item.format_options, null, 2);

    this.updateSourceOptions();
  }
}
