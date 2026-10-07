"""Build a readable PDF archive of all Patchline source code for Devpost."""

from pathlib import Path
import textwrap

from reportlab.lib.colors import HexColor
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "submission" / "Patchline-Code.pdf"
SOURCES = [
    "index.html",
    "demo.html",
    "styles.css",
    "app.js",
    "engine.js",
    "tests/engine.test.mjs",
    "submission/make_onepager.py",
    "submission/record-demo.cjs",
    "submission/make_code_pdf.py",
]

PAGE_W, PAGE_H = 612, 792
LEFT, RIGHT, TOP, BOTTOM = 43, 43, 48, 45
LEADING = 10.6
FONT_SIZE = 7.7
INK = HexColor("#100F0D")
TERRA = HexColor("#C24C2B")
FAINT = HexColor("#BEB9AF")
PAPER = HexColor("#F8F6F0")

pdfmetrics.registerFont(TTFont("Andale", "/System/Library/Fonts/Supplemental/Andale Mono.ttf"))
pdfmetrics.registerFont(TTFont("Arial", "/Library/Fonts/Arial Unicode.ttf"))


def base_page(pdf, page_number, label):
    pdf.setFillColor(PAPER)
    pdf.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    pdf.setStrokeColor(FAINT)
    pdf.setLineWidth(0.5)
    pdf.line(LEFT, PAGE_H - 37, PAGE_W - RIGHT, PAGE_H - 37)
    pdf.line(LEFT, BOTTOM - 10, PAGE_W - RIGHT, BOTTOM - 10)
    pdf.setFont("Andale", 7.5)
    pdf.setFillColor(TERRA)
    pdf.drawString(LEFT, PAGE_H - 27, "PATCHLINE / SOURCE ARCHIVE")
    pdf.setFillColor(INK)
    pdf.drawRightString(PAGE_W - RIGHT, PAGE_H - 27, label.upper()[:50])
    pdf.setFont("Andale", 7)
    pdf.drawString(LEFT, BOTTOM - 24, "SIMULATED PROTOTYPE · NO MEDICAL USE")
    pdf.drawRightString(PAGE_W - RIGHT, BOTTOM - 24, f"{page_number:02d}")


pdf = canvas.Canvas(str(OUTPUT), pagesize=(PAGE_W, PAGE_H), pageCompression=1)
pdf.setTitle("Patchline — Complete Source Code")
pdf.setAuthor("Rishik Rontala")
page_number = 1
base_page(pdf, page_number, "INDEX")
pdf.setFillColor(INK)
pdf.setFont("Arial", 34)
pdf.drawString(LEFT, PAGE_H - 118, "Patchline")
pdf.setFont("Arial", 20)
pdf.drawString(LEFT, PAGE_H - 148, "Complete source code")
pdf.setFont("Arial", 10)
pdf.drawString(LEFT, PAGE_H - 184, "Built by Rishik Rontala · 6 October 2026")
pdf.drawString(LEFT, PAGE_H - 201, "Public repository: github.com/rishikrrontala-bot/patchline")
pdf.drawString(LEFT, PAGE_H - 228, "This archive includes every source file for the browser prototype, tests,")
pdf.drawString(LEFT, PAGE_H - 244, "demo recorder, and PDF generators. Generated media and PDFs are excluded.")
y = PAGE_H - 290
pdf.setFont("Andale", 9)
for index, source in enumerate(SOURCES, 1):
    pdf.setFillColor(TERRA)
    pdf.drawString(LEFT, y, f"{index:02d}")
    pdf.setFillColor(INK)
    pdf.drawString(LEFT + 35, y, source)
    y -= 24
pdf.setFont("Arial", 10)
pdf.setFillColor(INK)
pdf.drawString(LEFT, BOTTOM + 55, "All wound readings and labels in the prototype are synthetic.")
pdf.drawString(LEFT, BOTTOM + 38, "The code cannot diagnose infection or operate treatment hardware.")
pdf.showPage()

for source in SOURCES:
    lines = (ROOT / source).read_text(encoding="utf-8").splitlines()
    page_number += 1
    base_page(pdf, page_number, source)
    y = PAGE_H - TOP - 16
    pdf.setFillColor(INK)
    pdf.setFont("Arial", 15)
    pdf.drawString(LEFT, y, source)
    y -= 24
    for line_number, line in enumerate(lines, 1):
        # Monospaced code wraps at the printable width; continuation rows are marked.
        chunks = textwrap.wrap(
            line.expandtabs(2), width=96, break_long_words=True,
            break_on_hyphens=False, replace_whitespace=False, drop_whitespace=False,
        ) or [""]
        for chunk_index, chunk in enumerate(chunks):
            if y < BOTTOM + 2:
                pdf.showPage()
                page_number += 1
                base_page(pdf, page_number, source)
                y = PAGE_H - TOP - 16
                pdf.setFont("Arial", 15)
                pdf.setFillColor(INK)
                pdf.drawString(LEFT, y, f"{source} / continued")
                y -= 24
            pdf.setFont("Andale", FONT_SIZE)
            pdf.setFillColor(TERRA)
            pdf.drawRightString(LEFT + 30, y, str(line_number) if chunk_index == 0 else ">")
            pdf.setFillColor(INK)
            pdf.drawString(LEFT + 41, y, chunk)
            y -= LEADING
    pdf.showPage()

pdf.save()
print(OUTPUT)
