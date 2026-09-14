# MIDIBack listening demo

Companion listening page for the MIDIBack paper draft:
harmony-aware automatic pitch correction conditioned on symbolic accompaniment.

**Live site:** https://joaquimbreno.github.io/MidiBackDemo/

## Pages

- `index.html` — abstract, architecture, links
- `correction.html` — original / detune / outshift+detune / MIDIBack / BERT-APC (GRU-only) / DDPC
- `case-study.html` — held vocal + transposed backing (MIR-1K `geniusturtle_7_07`)

Audio uses **Praat TD-PSOLA** via Parselmouth. Test clips from **ccmixter** and **MIR-1K**.

## Local preview

Serve the repo root over HTTP (not `file://`):

```bash
cd MidiBackDemo
python -m http.server 8080
```

Open http://127.0.0.1:8080/

## Authors

Joaquim Cavalcante, Yicheng Gu, Adriel Trajano, Yuri de Malheiros, Thais Gaudencio  
Affiliations: UFPB, Aalto, Music AI / Moises
