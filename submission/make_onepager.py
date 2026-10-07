"""Build the one-page Patchline project summary PDF."""

from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor


OUT = Path(__file__).with_name("Patchline-One-Page.pdf")
W, H = 612, 792
PAPER = HexColor("#F4F1EA")
INK = HexColor("#151A18")
MUTED = HexColor("#667670")
RULE = HexColor("#C9D0C9")
TERRA = HexColor("#CE5B3A")
PALE = HexColor("#E9E3D8")


def label(c, text, x, y, color=MUTED, size=8):
    c.setFillColor(color)
    c.setFont("Courier-Bold", size)
    c.drawString(x, y, text.upper())


def body(c, lines, x, y, width=240, size=10.2, leading=14.5, color=INK):
    c.setFillColor(color)
    c.setFont("Helvetica", size)
    for line in lines:
        words = line.split()
        current = ""
        for word in words:
            candidate = f"{current} {word}".strip()
            if c.stringWidth(candidate, "Helvetica", size) > width and current:
                c.drawString(x, y, current)
                y -= leading
                current = word
            else:
                current = candidate
        if current:
            c.drawString(x, y, current)
            y -= leading
        y -= 3
    return y


def rule(c, y, x1=38, x2=574):
    c.setStrokeColor(RULE)
    c.setLineWidth(0.75)
    c.line(x1, y, x2, y)


def rounded(c, x, y, w, h, fill, radius=6):
    c.setFillColor(fill)
    c.roundRect(x, y, w, h, radius, stroke=0, fill=1)


def main():
    OUT.parent.mkdir(parents=True, exist_ok=True)
    c = canvas.Canvas(str(OUT), pagesize=(W, H), pageCompression=1)
    c.setTitle("Patchline | One-page project summary")
    c.setAuthor("Rishik Rontala")
    c.setFillColor(PAPER)
    c.rect(0, 0, W, H, stroke=0, fill=1)

    label(c, "PATCHLINE / SYSTEM STUDY 01", 38, 754, INK, 9)
    label(c, "UNIVABIO 2026", 477, 754, TERRA, 8)
    rule(c, 742)

    c.setFillColor(INK)
    c.setFont("Times-Roman", 29)
    c.drawString(38, 704, "A closed-loop bandage,")
    c.drawString(38, 673, "shown as a digital twin.")
    rounded(c, 424, 671, 150, 40, INK, 4)
    label(c, "SIMULATION ONLY", 440, 686, PAPER, 9)

    body(c, [
        "Patchline demonstrates how a future smart dressing could turn four wound-environment signals into a reviewable action - and stop when a sensor cannot be trusted."
    ], 38, 645, 525, 11, 15)
    rule(c, 596)

    label(c, "01  SENSE", 38, 572, TERRA)
    label(c, "02  LEARN", 181, 572, TERRA)
    label(c, "03  ORCHESTRATE", 325, 572, TERRA)
    label(c, "04  SHOW", 469, 572, TERRA)
    c.setStrokeColor(RULE)
    c.setLineWidth(1)
    c.line(38, 557, 574, 557)
    for x in [38, 181, 325, 469, 574]:
        c.setFillColor(TERRA)
        c.circle(x, 557, 2.7, stroke=0, fill=1)
    body(c, ["pH, patch temperature, dressing wetness, wound-fluid glucose"], 38, 540, 118, 9.3, 12.5)
    body(c, ["A small model trains and tests on separate synthetic traces"], 181, 540, 118, 9.3, 12.5)
    body(c, ["A quality gate checks the score and may refuse to proceed"], 325, 540, 118, 9.3, 12.5)
    body(c, ["Virtual ultrasound and violet states; evidence-linked handoff"], 469, 540, 105, 9.3, 12.5)

    rule(c, 478)
    label(c, "THE LIVE DEMO", 38, 453, INK, 8)
    label(c, "WHAT THE PROTOTYPE PROVES", 314, 453, INK, 8)

    c.setFillColor(INK)
    c.setFont("Times-Roman", 18)
    c.drawString(38, 428, "From change to restraint")
    c.drawString(314, 428, "A visible decision loop")

    body(c, [
        "1  Select a stable stream. The virtual patch records four generated channels.",
        "2  Select a changing stream. The trained model scores a synthetic pattern; the orchestrator explains a virtual response.",
        "3  Inject a pH fault. The quality gate cancels virtual outputs and asks for a recheck and human review."
    ], 38, 407, 235, 9.7, 13.2)

    body(c, [
        "Reproducible sensor streams, manual controls, held-out synthetic evaluation, event history, and a simulated board/firmware view.",
        "Every decision shows its input window and reason. Virtual outputs use abstract levels 0-3; they are not physical settings."
    ], 314, 407, 252, 9.7, 13.2)

    rounded(c, 38, 191, 536, 83, PALE, 5)
    c.setFillColor(TERRA)
    c.rect(38, 191, 4, 83, stroke=0, fill=1)
    label(c, "RESEARCH BOUNDARY", 54, 253, TERRA, 8)
    body(c, [
        "No patient data, physical patch, clinical validation, infection diagnosis, or delivered treatment. Synthetic labels test software behavior only. Wound-fluid glucose is not blood glucose. This concept cannot guide care."
    ], 54, 235, 499, 9.6, 13.1)

    label(c, "EVIDENCE CONTEXT", 38, 164, INK, 8)
    body(c, [
        "IWGDF/IDSA: diabetes-related foot infection requires clinical assessment; foot temperature alone is not a diagnostic test. IWGDF wound-healing guidance does not establish this proposed physical-therapy approach as routine care."
    ], 38, 147, 536, 8.5, 11.3, MUTED)
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 7.2)
    c.drawString(38, 88, "Sources: idsociety.org/practice-guideline/diabetic-foot-infections/")
    c.drawString(38, 78, "onlinelibrary.wiley.com/doi/10.1002/dmrr.3644")

    rule(c, 61)
    label(c, "BUILT BY RISHIK RONTALA", 38, 41, INK, 8)
    label(c, "INTERACTIVE PROTOTYPE + OPEN CODE", 349, 41, MUTED, 7)
    c.showPage()
    c.save()
    print(OUT)


if __name__ == "__main__":
    main()
