import * as Tone from 'tone';
import type { InstrumentType, NoteDuration, Pitch, Track } from '../types';

export class AudioEngine {
  private synths: Map<string, Tone.PolySynth> = new Map();
  private analyser: Tone.Analyser;
  private isPlaying: boolean = false;

  constructor() {
    this.analyser = new Tone.Analyser('waveform', 2048);
    Tone.getDestination().connect(this.analyser);
  }

  async initialize() {
    await Tone.start();
  }

  createInstrument(trackId: string, instrumentType: InstrumentType): Tone.PolySynth {
    if (this.synths.has(trackId)) {
      const existing = this.synths.get(trackId)!;
      existing.dispose();
    }

    let synth: Tone.PolySynth;

    switch (instrumentType) {
      case 'drums':
        synth = new Tone.PolySynth(Tone.MembraneSynth).toDestination();
        break;
      case 'bass':
        synth = new Tone.PolySynth(Tone.MonoSynth, {
          oscillator: { type: 'sawtooth' },
          envelope: { attack: 0.01, decay: 0.2, sustain: 0.3, release: 0.5 }
        }).toDestination();
        break;
      case 'synth':
        synth = new Tone.PolySynth(Tone.Synth, {
          oscillator: { type: 'square' },
          envelope: { attack: 0.005, decay: 0.1, sustain: 0.3, release: 1 }
        }).toDestination();
        break;
      case 'piano':
        synth = new Tone.PolySynth(Tone.Synth, {
          oscillator: { type: 'triangle' },
          envelope: { attack: 0.02, decay: 0.1, sustain: 0.6, release: 1 }
        }).toDestination();
        break;
      case 'guitar':
        synth = new Tone.PolySynth(Tone.Synth, {
          oscillator: { type: 'triangle' },
          envelope: { attack: 0.01, decay: 0.4, sustain: 0.2, release: 1.4 }
        }).toDestination();
        break;
      case 'pad':
        synth = new Tone.PolySynth(Tone.Synth, {
          oscillator: { type: 'sine' },
          envelope: { attack: 0.8, decay: 0.5, sustain: 0.8, release: 2 }
        }).toDestination();
        break;
      default:
        synth = new Tone.PolySynth(Tone.Synth).toDestination();
    }

    this.synths.set(trackId, synth);
    return synth;
  }

  setTrackVolume(trackId: string, volume: number) {
    const synth = this.synths.get(trackId);
    if (synth) {
      synth.volume.value = Tone.gainToDb(volume);
    }
  }

  setTempo(bpm: number) {
    Tone.getTransport().bpm.value = bpm;
  }

  getDurationInSeconds(duration: NoteDuration, bpm: number): number {
    const beatDuration = 60 / bpm;
    const durationMap: Record<NoteDuration, number> = {
      whole: beatDuration * 4,
      half: beatDuration * 2,
      quarter: beatDuration,
      eighth: beatDuration / 2,
      sixteenth: beatDuration / 4
    };
    return durationMap[duration];
  }

  playNote(
    trackId: string,
    pitch: Pitch,
    octave: number,
    duration: NoteDuration,
    velocity: number,
    time?: number
  ) {
    const synth = this.synths.get(trackId);
    if (!synth) return;

    const note = `${pitch}${octave}`;
    const durationSeconds = this.getDurationInSeconds(duration, Tone.getTransport().bpm.value);

    if (time !== undefined) {
      synth.triggerAttackRelease(note, durationSeconds, time, velocity);
    } else {
      synth.triggerAttackRelease(note, durationSeconds, undefined, velocity);
    }
  }

  scheduleTrack(track: Track) {
    if (!this.synths.has(track.id)) {
      this.createInstrument(track.id, track.instrumentType);
    }

    this.setTrackVolume(track.id, track.muted ? 0 : track.volume);

    const synth = this.synths.get(track.id);
    if (!synth) return;

    track.notes.forEach(note => {
      const noteName = `${note.pitch}${note.octave}`;
      const durationSeconds = this.getDurationInSeconds(note.duration, Tone.getTransport().bpm.value);

      Tone.getTransport().schedule((time) => {
        synth.triggerAttackRelease(noteName, durationSeconds, time, note.velocity);
      }, `0:${note.position}:0`);
    });
  }

  play(tracks: Track[], tempo: number) {
    this.setTempo(tempo);
    this.stop();

    tracks.forEach(track => {
      if (!track.muted) {
        this.scheduleTrack(track);
      }
    });

    Tone.getTransport().start();
    this.isPlaying = true;
  }

  stop() {
    Tone.getTransport().stop();
    Tone.getTransport().cancel();
    this.synths.forEach(synth => {
      synth.releaseAll();
    });
    this.isPlaying = false;
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  getAnalyserData(): Float32Array {
    const data = this.analyser.getValue();
    if (Array.isArray(data)) {
      return data[0] as Float32Array;
    }
    return data as Float32Array;
  }

  dispose() {
    this.stop();
    this.synths.forEach(synth => synth.dispose());
    this.synths.clear();
    this.analyser.dispose();
  }
}

export const audioEngine = new AudioEngine();
