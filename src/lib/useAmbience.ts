// Plays the story's ambient loop while the story is on screen and sound is on.
// Respects the silent switch, mixes with whatever else is playing (your podcast
// keeps going), fades in and out, and stops when the app goes to the background.

import { useEffect, useRef, useState } from 'react';
import { AppState as RNAppState } from 'react-native';
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import { soundAssets } from '@/content/soundAssets';
import type { Soundscape } from './soundscape';

const VOLUME = 0.6;
const FADE_MS = 1200;
const STEPS = 12;

let modeSet = false;

export function useAmbience(soundscape: Soundscape, on: boolean, focused: boolean) {
  const player = useAudioPlayer(soundAssets[soundscape]);
  const [active, setActive] = useState(RNAppState.currentState === 'active');
  const current = useRef(soundscape);

  useEffect(() => {
    if (modeSet) return;
    modeSet = true;
    setAudioModeAsync({ playsInSilentMode: false, interruptionMode: 'mixWithOthers', shouldPlayInBackground: false }).catch(() => {});
  }, []);

  useEffect(() => {
    const sub = RNAppState.addEventListener('change', (s) => setActive(s === 'active'));
    return () => sub.remove();
  }, []);

  // A new scene (dusk falls, the rain starts) swaps the loop.
  useEffect(() => {
    if (current.current === soundscape) return;
    current.current = soundscape;
    player.replace(soundAssets[soundscape]);
  }, [player, soundscape]);

  const playing = on && focused && active;
  useEffect(() => {
    player.loop = true;
    if (playing) {
      if (!player.playing) player.volume = 0;
      player.play(); // also restarts after a new loop was swapped in
    }
    // Fade from wherever the volume is now to full (playing) or silent (then pause).
    const from = player.volume;
    const to = playing ? VOLUME : 0;
    let step = 0;
    const timer = setInterval(() => {
      step += 1;
      player.volume = from + ((to - from) * step) / STEPS;
      if (step < STEPS) return;
      clearInterval(timer);
      if (!playing) player.pause();
    }, FADE_MS / STEPS);
    return () => clearInterval(timer);
  }, [player, playing, soundscape]);
}
