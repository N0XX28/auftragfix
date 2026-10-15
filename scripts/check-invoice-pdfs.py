#!/usr/bin/env python3
"""Prüft ausschließlich lokal erzeugte fiktive Rechnungs-PDFs."""
from pathlib import Path
from subprocess import run
import xml.etree.ElementTree as ET

for filename in [Path('examples/muster-rechnung.pdf'), Path('/tmp/auftragfix-invoice-long.pdf')]:
    xml = run(['pdftotext', '-bbox-layout', str(filename), '-'], check=True, capture_output=True, text=True).stdout
    root = ET.fromstring(xml)
    pages = [e for e in root.iter() if e.tag.endswith('}page')]
    words = [e for e in root.iter() if e.tag.endswith('}word')]
    content = ' '.join(e.text or '' for e in words)
    assert pages, filename
    assert 'MUSTER' in content, filename
    for page in pages:
        width, height = float(page.attrib['width']), float(page.attrib['height'])
        for word in page.iter():
            if not word.tag.endswith('}word'):
                continue
            x0, y0, x1, y1 = (float(word.attrib[k]) for k in ['xMin', 'yMin', 'xMax', 'yMax'])
            assert x0 >= -1 and y0 >= -1 and x1 <= width + 1 and y1 <= height + 1, (filename, word.text)
    if filename.name == 'muster-rechnung.pdf':
        assert len(pages) == 1, 'Einfache Musterrechnung soll auf eine Seite passen.'
        for private in ['Einkauf', 'Eigene Kosten', 'Kalkulationsdifferenz', 'Kundennotiz']:
            assert private not in content, private
    else:
        assert 'Muster-Ersatzteil 100' in content
        assert 'ENDE-DER-LEISTUNGEN' in content
        assert len(pages) >= 3
    print(f'{filename.resolve()}: {len(pages)} Seiten, Inhalt vollständig, keine Wörter außerhalb der A4-Seiten.')
