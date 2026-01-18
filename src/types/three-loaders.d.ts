// Declaraciones de tipos para loaders de Three.js
declare module 'three/examples/jsm/loaders/DRACOLoader' {
    import { Loader, BufferGeometry } from 'three';

    export class DRACOLoader extends Loader {
        constructor();
        setDecoderPath(path: string): this;
        setDecoderConfig(config: object): this;
        setWorkerLimit(limit: number): this;
        preload(): this;
        dispose(): void;
    }
}

declare module 'three/examples/jsm/loaders/GLTFLoader' {
    import { Loader, Group, AnimationClip, Camera, Scene } from 'three';
    import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';

    export interface GLTF {
        animations: AnimationClip[];
        scene: Group;
        scenes: Group[];
        cameras: Camera[];
        asset: object;
    }

    export class GLTFLoader extends Loader {
        constructor();
        load(
            url: string,
            onLoad: (gltf: GLTF) => void,
            onProgress?: (event: ProgressEvent) => void,
            onError?: (error: ErrorEvent) => void
        ): void;
        setDRACOLoader(dracoLoader: DRACOLoader): this;
        setKTX2Loader(ktx2Loader: any): this;
        parse(data: ArrayBuffer | string, path: string, onLoad: (gltf: GLTF) => void, onError?: (error: ErrorEvent) => void): void;
    }
}

declare module 'three/examples/jsm/loaders/KTX2Loader' {
    import { Loader, CompressedTexture, WebGLRenderer } from 'three';

    export class KTX2Loader extends Loader {
        constructor();
        setTranscoderPath(path: string): this;
        setWorkerLimit(limit: number): this;
        detectSupport(renderer: WebGLRenderer): this;
        dispose(): void;
    }
}
