declare module "sync-input" {
    export default function input(prompt: string): string;
}

declare module "hs-test-web" {
    export class StageTest {
        getPage(url: string): {
            execute<T>(callback: () => T | Promise<T>): unknown;
        };
    }

    export function correct(): unknown;
    export function wrong(message?: string): unknown;
}

interface Window {
    __dogfight?: {
        ready?: boolean;
        resetPlayer(): void;
        getState(): {
            player: {
                roll: number;
                forward: [number, number, number];
                throttle: number;
                speed: number;
                position: [number, number, number];
            };
            camera: {
                position: [number, number, number];
            };
            ui: {
                reticleVisible: boolean;
            };
        };
        setKey(code: string, pressed: boolean): void;
        stepFrames(frames: number): {
            player: {
                roll: number;
                forward: [number, number, number];
                throttle: number;
                speed: number;
                position: [number, number, number];
            };
            camera: {
                position: [number, number, number];
            };
            ui: {
                reticleVisible: boolean;
            };
        };
    };
}
