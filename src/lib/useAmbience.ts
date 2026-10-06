// The story's sound: an ambient loop for the scene (the dawn chorus, crickets, waves,
// rain), plus the voice of the animal the story is about, when we have a recording of
// them. Both play continuously while the story is on screen and sound is on. The
// ambient loop changes only when the scene does (dusk falls, the rain starts); the
// voice changes only when the animal does. Changes cross-fade.
//
// Respects the silent switch, mixes with whatever else is playing (your podcast keeps
// going), and stops when the app goes to the background.

import { useEffect, useRef, useState } from 'react';
import { AppState as RNAppState } from 'react-native';
import { setAudioModeAsync, useAudioPlayer, type AudioPlayer } from 'expo-audio';
import { soundAssets } from '@/content/soundAssets';
import type { Soundscape } from './soundscape';

const AMBIENT_VOLUME = 0.5;
const VOICE_VOLUME = 0.8;
const FADE_MS = 1200;
const SWAP_MS = 500;
const STEPS = 12;

// Set the audio mode once, and wait for it before playing: changing the audio session
// under a sound that's already playing makes iOS pause it.
let mode: Promise<void> | null = null;
const audioReady = () =>
  (mode ??= setAudioModeAsync({ playsInSilentMode: false, interruptionMode: 'mixWithOthers', shouldPlayInBackground: false }).catch(() => {}));

/** The voice loop for a species, if we have a recording of them. */
export function voiceFor(speciesId: string | undefined): number | null {
  return (speciesId && soundAssets[`voice-${speciesId}`]) || null;
}

export function useAmbience(soundscape: Soundscape, voiceSpeciesId: string | undefined, on: boolean, focused: boolean) {
  const [active, setActive] = useState(RNAppState.currentState === 'active');
  useEffect(() => {
    const sub = RNAppState.addEventListener('change', (s) => setActive(s === 'active'));
    return () => sub.remove();
  }, []);
  const playing = on && focused && active;
  useLoop(soundAssets[soundscape], playing, AMBIENT_VOLUME);
  useLoop(voiceFor(voiceSpeciesId), playing, VOICE_VOLUME);
}

/** One looping layer. The player lives as long as the screen; sources swap with a fade. */
function useLoop(source: number | null, playing: boolean, volume: number) {
  const player = useAudioPlayer(null);
  const loaded = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | undefined;
    const fadeTo = (to: number, ms: number, done?: () => void) => {
      clearInterval(timer);
      const from = player.volume;
      let step = 0;
      timer = setInterval(() => {
        step += 1;
        player.volume = from + ((to - from) * step) / STEPS;
        if (step < STEPS) return;
        clearInterval(timer);
        done?.();
      }, ms / STEPS);
    };
    const start = () =>
      audioReady().then(() => {
        if (cancelled) return;
        player.loop = true; // set after every replace, which resets it
        if (!player.playing) player.volume = 0;
        player.play();
        fadeTo(volume, FADE_MS);
      });
    const want = playing && source !== null;

    if (source !== loaded.current) {
      // A different scene or animal: fade out what's playing, swap, fade back in.
      const swap = () => {
        if (cancelled) return;
        loaded.current = source;
        if (source === null) return player.pause();
        replaceSource(player, source);
        if (want) start();
      };
      if (player.playing) fadeTo(0, SWAP_MS, swap);
      else swap();
    } else if (want) {
      start();
    } else if (player.playing) {
      fadeTo(0, FADE_MS, () => player.pause());
    }
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [player, source, playing, volume]);
}

function replaceSource(player: AudioPlayer, source: number) {
  player.pause();
  player.replace(source);
}
