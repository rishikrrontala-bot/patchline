# Patchline

**The signal between visits.** Built by Rishik Rontala for UnivaBio 2026.

Patchline is an interactive **digital twin** of a proposed smart bandage. It generates four synthetic wound-environment channels, trains a small classifier on separately generated synthetic traces, and shows how an orchestrator could react to a changing pattern while refusing to act on a faulty sensor. A hypothetical ultrasound/violet-light treatment proposal is shown only in abstract simulation units. The app has no hardware connection, clinical diagnosis, or treatment output.

## Run

This project has no dependencies or API key. From this folder:

```sh
python3 -m http.server 8000
```

Open `http://localhost:8000`. Choose **Stable**, **Pattern change**, and **Sensor fault**. Click a handoff claim to highlight its source readings. Use **Print report** to save a PDF from the browser.

The [live prototype](https://rishikrrontala-bot.github.io/patchline/) can be opened without installing anything. The [86-second silent demo](https://rishikrrontala-bot.github.io/patchline/demo.html) shows the complete interaction. The [one-page project brief](submission/Patchline-One-Page.pdf) and [complete source-code PDF](submission/Patchline-Code.pdf) are ready for the hackathon entry.

Run the deterministic checks with:

```sh
node --test tests/engine.test.mjs
```

## What works

- Four reproducible, visibly synthetic channels: patch temperature, dressing wetness, fluid pH, and experimental wound-fluid glucose.
- A trained synthetic-pattern classifier, trained on traces separate from the demo cases.
- Sensor-quality checks for missing, implausible, and noisy readings. A fault holds any hypothetical treatment proposal.
- An orchestrator with inspectable evidence and three communication actions: record, recheck, or prepare clinician review.
- A clearly simulated control-plane proposal that depicts both ultrasound and violet light using **abstract 0–3 simulation units**. These units have no physical energy, wavelength exposure, duration, or medical interpretation.
- Evidence-linked handoff and a printable report.

The model and orchestrator are deliberately distinct. The model scores patterns in generated data. The orchestrator combines that score with data-quality flags and produces a reviewable record. Neither component can diagnose infection or operate a therapy device.

## Architecture

```text
Seeded synthetic generator (four channels)
  → sensor-quality gate
  → classifier trained on separate synthetic traces
  → constrained orchestrator
      ↘ evidence-linked handoff
      ↘ treatment visualization in abstract simulation units only
```

`engine.js` contains the simulator, model, quality checks, and orchestrator. `app.js` renders the interface. There is no backend, patient account, sensor pairing, actuator endpoint, or external transmission.

## Evidence and boundaries

The [IWGDF/IDSA guideline](https://www.idsociety.org/practice-guideline/diabetic-foot-infections/) says diabetes-related foot infection is diagnosed clinically and suggests against using foot temperature to diagnose soft-tissue infection. The [IWGDF wound-healing guideline](https://onlinelibrary.wiley.com/doi/10.1002/dmrr.3644) does not support the proposed physical therapies as routine care. See [LIMITATIONS.md](LIMITATIONS.md) and [MODEL_CARD.md](MODEL_CARD.md) for the research boundary.

This is a hackathon demonstration of a **system design**, not a medical device. Nothing here should be used on a person or to choose care.

## Submission

UnivaBio requires an interactive prototype, a demo video, a one-page project PDF, and code. Draft materials are under `submission/`. The live Devpost schedule lists October 13, 2026 at 11:45 p.m. EDT, while older rules/organizer pages show October 6–7; the project was prepared against the earlier date. The video is silent and shows the actual running app; `submission/record-demo.cjs` is its recording script.

## Credits

Concept, implementation, and presentation: **Rishik Rontala**. AI-assisted development should be disclosed in the submission. Scientific and event sources are linked in the concept and limitations documents.
