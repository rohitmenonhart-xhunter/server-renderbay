declare module 'three/examples/jsm/loaders/STLLoader' {
  import { BufferGeometry, Loader } from 'three';
  export class STLLoader extends Loader {
    constructor();
    load(
      url: string,
      onLoad: (geometry: BufferGeometry) => void,
      onProgress?: (event: ProgressEvent) => void,
      onError?: (event: ErrorEvent) => void
    ): void;
    parse(data: ArrayBuffer | string): BufferGeometry;
  }
} 