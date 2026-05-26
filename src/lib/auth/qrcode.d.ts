declare module "qrcode" {
  function toDataURL(text: string, options?: any): Promise<string>;
  function toString(text: string, options?: any): Promise<string>;
  function toCanvas(canvas: HTMLCanvasElement, text: string, options?: any): Promise<void>;
}
