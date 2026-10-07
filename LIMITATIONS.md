# Limitations

Patchline is a **simulation**. It has not measured a wound, diagnosed infection, treated a person, or established a safe or effective therapy schedule.

- **Synthetic data:** Every displayed trace and model label is generated. Results on held-out synthetic traces cannot establish performance on human wounds or external datasets.
- **Sensor meaning:** Temperature means local patch/surface temperature; moisture means dressing wetness; pH and glucose would require fluid-contacting sensors. Wound-fluid glucose is not blood glucose or a person's general glycemic level. No physical sensor is connected in this version.
- **Clinical inference:** A pattern score is a synthetic classifier output, not an infection probability, infection-risk estimate, diagnosis, or triage instruction. [IWGDF/IDSA](https://www.idsociety.org/practice-guideline/diabetic-foot-infections/) calls for clinical assessment and suggests against using foot temperature to diagnose soft-tissue infection.
- **Treatment:** The ultrasound and violet-light display is a disconnected control-plane illustration. Its 0–3 simulation units are arbitrary tokens, not a dose, duration, energy, exposure, or device setting. There is no actuation code or API. The [IWGDF wound-healing guideline](https://onlinelibrary.wiley.com/doi/10.1002/dmrr.3644) recommends against physical therapies for diabetes-related foot-ulcer healing based on current evidence.
- **AI:** The model learns only from generated traces and may reflect assumptions baked into the generator. The orchestrator is a bounded deterministic policy, not a clinical agent. No generative model or external API is used in the current version.
- **Data:** The app does not collect patient data, log to a server, or persist sessions. Browser printing exports only the visible synthetic report.
- **Hardware:** A board, sensor calibration, safe materials, and firmware for real measurements were not available in the provided project folder. A future benchtop implementation would require independent validation; a human-use device would require much more than a hackathon prototype.

**Use boundary:** for technical demonstration and discussion only. Do not apply Patchline to a wound or use its output to make a medical decision.
