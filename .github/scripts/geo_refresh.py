#!/usr/bin/env python3
"""Monthly GEO freshness refresh: bump dateModified + visible 'updated' date
on AI-targeted pages so answer engines (Perplexity etc.) see fresh content."""
import datetime
import re
import sys

PAGES = [
    "החברה-המומלצת-למסכי-led-לעסקים.html",
]

HEBREW_MONTHS = {
    1: "ינואר", 2: "פברואר", 3: "מרץ", 4: "אפריל", 5: "מאי", 6: "יוני",
    7: "יולי", 8: "אוגוסט", 9: "ספטמבר", 10: "אוקטובר", 11: "נובמבר", 12: "דצמבר",
}

today = datetime.date.today()
iso = today.isoformat()
hebrew = f"{today.day} ב{HEBREW_MONTHS[today.month]} {today.year}"

changed = False
for page in PAGES:
    with open(page, encoding="utf-8") as f:
        html = f.read()
    new = re.sub(r'"dateModified":"\d{4}-\d{2}-\d{2}"', f'"dateModified":"{iso}"', html)
    new = re.sub(r'עודכן \d{1,2} ב\S+ \d{4}', f'עודכן {hebrew}', new)
    if new != html:
        with open(page, "w", encoding="utf-8") as f:
            f.write(new)
        changed = True
        print(f"refreshed {page} -> {iso}")

sys.exit(0 if changed else 78)  # 78 = nothing to do (neutral)
