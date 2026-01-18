// Tipos para @react-three/xr si el paquete no está instalado
declare module '@react-three/xr' {
    import { ReactNode, FC } from 'react';
    import { Object3D, Vector3, Euler } from 'three';

    interface XRProps {
        children?: ReactNode;
    }

    export const XR: FC<XRProps>;
    export const Controllers: FC<{}>;
    export const Hands: FC<{}>;
    export const VRButton: FC<{}>;

    interface XRState {
        isPresenting: boolean;
        player: {
            position: Vector3;
            rotation: Euler;
        } | null;
    }

    export function useXR(): XRState;
}
