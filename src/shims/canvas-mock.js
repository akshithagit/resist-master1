// Complete shim for canvas module to prevent Metro bundling errors during Expo web export & SSR
class MockDOMMatrix {
  constructor() {
    this.a = 1; this.b = 0; this.c = 0; this.d = 1; this.e = 0; this.f = 0;
  }
  multiply() { return this; }
  inverse() { return this; }
  translate() { return this; }
  scale() { return this; }
  rotate() { return this; }
}

class MockPath2D {
  addPath() {}
  closePath() {}
  moveTo() {}
  lineTo() {}
  bezierCurveTo() {}
  quadraticCurveTo() {}
  arc() {}
  arcTo() {}
  ellipse() {}
  rect() {}
}

class MockImageData {
  constructor(width, height) {
    this.width = width || 0;
    this.height = height || 0;
    this.data = new Uint8ClampedArray((this.width * this.height * 4) || 0);
  }
}

const mockCanvasInstance = {
  width: 100,
  height: 100,
  getContext: () => ({
    fillRect: () => {},
    clearRect: () => {},
    getImageData: (x, y, w, h) => new MockImageData(w, h),
    putImageData: () => {},
    createImageData: (w, h) => new MockImageData(w, h),
    setTransform: () => {},
    drawImage: () => {},
    save: () => {},
    fillText: () => {},
    restore: () => {},
    beginPath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    closePath: () => {},
    stroke: () => {},
    translate: () => {},
    scale: () => {},
    rotate: () => {},
    arc: () => {},
    fill: () => {},
    measureText: () => ({ width: 0 }),
    transform: () => {},
    rect: () => {},
    clip: () => {},
  }),
  toBuffer: () => Buffer.from([]),
  toDataURL: () => '',
};

module.exports = {
  createCanvas: (width, height) => ({ ...mockCanvasInstance, width, height }),
  loadImage: () => Promise.resolve({}),
  Image: class Image {},
  ImageData: MockImageData,
  DOMMatrix: MockDOMMatrix,
  Path2D: MockPath2D,
  Canvas: class Canvas {},
};
