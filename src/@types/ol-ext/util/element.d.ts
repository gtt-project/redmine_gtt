declare module 'ol-ext/util/element' {
  interface CreateElementOptions {
    className?: string;
    parent?: Element;
    html?: Element | string;
    text?: string;
    options?: Record<string, string>;
    style?: Record<string, string | number>;
    change?: EventListener;
    click?: EventListener;
    on?: Record<string, EventListener>;
    checked?: boolean;
    [key: string]: any;
  }

  interface SwitchOptions extends CreateElementOptions {
    html?: string | Element;
    after?: string | Element;
    checked?: boolean;
  }

  interface CheckOptions extends CreateElementOptions {
    html?: string | Element;
    after?: string | Element;
    name?: string;
    type?: 'checkbox' | 'radio';
    value?: string;
  }

  interface ScrollDivOptions {
    onmove?: (scrolling: boolean) => void;
    vertical?: boolean;
    animate?: boolean;
    mousewheel?: boolean;
    minibar?: boolean;
  }

  interface ScrollDivResult {
    refresh: () => void;
  }

  interface OffsetRect {
    top: number;
    left: number;
    height: number;
    width: number;
  }

  interface PositionRect {
    top: number;
    left: number;
    bottom: number;
    right: number;
  }

  export namespace ol_ext_element {
    function create(tagName: string, options?: CreateElementOptions): Element | Text;
    function createSwitch(options: SwitchOptions): HTMLInputElement;
    function createCheck(options: CheckOptions): HTMLInputElement;
    function setHTML(element: Element, html: Element | string): void;
    function appendText(element: Element, text: string): void;
    function addListener(element: Element, eventType: string | string[], fn: EventListener, useCapture?: boolean): void;
    function removeListener(element: Element, eventType: string | string[], fn: EventListener): void;
    function show(element: Element): void;
    function hide(element: Element): void;
    function hidden(element: Element): boolean;
    function toggle(element: Element): void;
    function setStyle(el: Element, st: Record<string, string | number>): void;
    function getStyle(el: Element, styleProp: string): string | number;
    function outerHeight(elt: Element): number;
    function outerWidth(elt: Element): number;
    function offsetRect(elt: Element): OffsetRect;
    function getFixedOffset(elt: Element): { top: number; left: number };
    function positionRect(elt: Element, fixed?: boolean): PositionRect;
    function scrollDiv(elt: Element, options?: ScrollDivOptions): ScrollDivResult;
    function dispatchEvent(eventName: string, element: Element): void;
  }

  export default ol_ext_element;
}
