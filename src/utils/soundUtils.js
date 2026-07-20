/**
 * soundUtils.js
 * Synthesized audio feedback using Web Audio API
 */

let audioCtx = null;

const initAudio = () => {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    return audioCtx;
};

import { useUIStore } from '../store/uiStore';

// ... (existing styles/code if appropriate, but here just updating logic)

/**
 * Plays a synthesized UI sound
 * @param {string} type - 'click', 'hover', 'swish', 'success', 'donate', 'error', 'fireworks'
 */
export const playUiSound = (type) => {
    // Check global preference
    const { soundEnabled } = useUIStore.getState();
    if (!soundEnabled) return;

    try {
        const ctx = initAudio();
        const masterGain = ctx.createGain();
        masterGain.connect(ctx.destination);

        // Base volume
        masterGain.gain.setValueAtTime(0.3, ctx.currentTime);

        switch (type) {
            case 'click':
                playClick(ctx, masterGain);
                break;
            case 'hover':
                playHover(ctx, masterGain);
                break;
            case 'swish':
                playSwish(ctx, masterGain);
                break;
            case 'success':
                playSuccess(ctx, masterGain);
                break;
            case 'donate':
                playDonate(ctx, masterGain);
                break;
            case 'fireworks':
                playFireworks(ctx, masterGain);
                break;
            case 'error':
                playError(ctx, masterGain);
                break;
            default:
                break;
        }
    } catch (error) {
        console.warn('Audio playback failed:', error);
    }
};

const playClick = (ctx, master) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

    osc.connect(gain);
    gain.connect(master);

    osc.start();
    osc.stop(ctx.currentTime + 0.1);
};

const playHover = (ctx, master) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, ctx.currentTime);

    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.03, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(master);

    osc.start();
    osc.stop(ctx.currentTime + 0.05);
};

const playSwish = (ctx, master) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.2);

    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

    osc.connect(gain);
    gain.connect(master);

    osc.start();
    osc.stop(ctx.currentTime + 0.2);
};

const playSuccess = (ctx, master) => {
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const time = ctx.currentTime + i * 0.1;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, time);

        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.15, time + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.4);

        osc.connect(gain);
        gain.connect(master);

        osc.start(time);
        osc.stop(time + 0.5);
    });
};

const playDonate = (ctx, master) => {
    const now = ctx.currentTime;
    const notes = [880, 1108.73, 1318.51, 1760]; // A5, C#6, E6, A6 (Major chord)

    notes.forEach((freq, i) => {
        for (let j = 0; j < 2; j++) {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const time = now + i * 0.1 + j * 0.03;

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq + (Math.random() * 20), time);

            gain.gain.setValueAtTime(0, time);
            gain.gain.linearRampToValueAtTime(0.1, time + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, time + 0.6);

            osc.connect(gain);
            gain.connect(master);

            osc.start(time);
            osc.stop(time + 0.7);
        }
    });
};

const playFireworks = (ctx, master) => {
    const now = ctx.currentTime;

    // Low boom
    const oscBoom = ctx.createOscillator();
    const gainBoom = ctx.createGain();
    oscBoom.type = 'triangle';
    oscBoom.frequency.setValueAtTime(100, now);
    oscBoom.frequency.exponentialRampToValueAtTime(40, now + 0.2);
    gainBoom.gain.setValueAtTime(0.2, now);
    gainBoom.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    oscBoom.connect(gainBoom);
    gainBoom.connect(master);
    oscBoom.start(now);
    oscBoom.stop(now + 0.3);

    // Crackle sparkles
    for (let i = 0; i < 15; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const freq = 2000 + Math.random() * 3000;
        const time = now + 0.1 + Math.random() * 0.4;

        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, time);

        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.03, time + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

        osc.connect(gain);
        gain.connect(master);

        osc.start(time);
        osc.stop(time + 0.15);
    }
};

const playError = (ctx, master) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(80, ctx.currentTime + 0.3);

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(master);

    osc.start();
    osc.stop(ctx.currentTime + 0.3);
};
