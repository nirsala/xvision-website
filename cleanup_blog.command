#!/bin/bash
# ============================================================
#  ניקוי בלוג xvision — מיזוג 51 כפילויות + מחיקת 3, עם 301
#  להרצה חד-פעמית בטרמינל של המאק.
# ============================================================
set -e
REPO="$HOME/xvision-website"
cd "$REPO" || { echo "❌ לא נמצא $REPO — עדכן את הנתיב בראש הסקריפט"; exit 1; }
echo "📁 מאגר: $REPO"
echo "⏬ מסנכרן עם main..."
git pull --rebase origin main || true

echo "🗑️  מוחק 54 קבצי בלוג כפולים/מיותרים..."
REMOVED=0
while IFS= read -r f; do
  [ -z "$f" ] && continue
  if [ -f "$f" ]; then git rm -q "$f" && REMOVED=$((REMOVED+1)); fi
done <<'FILES'
blog/בוט-וואטסאפ-עסקי-אוטומציה-מכירות-2026-07-21.html
blog/בחירת-מערכת-ניהול-תוכן-שילוט-דיגיטלי-2026-07-21.html
blog/השוואת-יצרני-מסכי-led-2026-07-21.html
blog/led-article-17-2026-07-21.html
blog/אוטומציה-לעסקים-מדריך-2026.html
blog/led-article-9-2026-07-13.html
blog/מערכת-ניהול-תוכן-ענן-למסכי-led-השוואה-2026-07-12.html
blog/led-article-8-2026-07-12.html
blog/led-article-7-2026-07-11.html
blog/מסכי-led-שקופים-2026-07-10.html
blog/מערכת-ניהול-תוכן-למסכים-איך-זה-עובד-.html
blog/led-article-33-2026-06-30.html
blog/led-article-31-2026-06-28.html
blog/מסכי-LED-שקופים-המדריך-המקצועי-2026-06-09.html
blog/מסכי-LED-לקניונים-שילוט-שמוכר-גם-כשאתם-ישנים.html
blog/מסכי-לד-לעסקים-מומלץ-2026.html
blog/מסכי-לובי-חוויית-כניסה-שתרשים-כל-מבקר.html
blog/שלטי-חוצות-דיגיטליים-מומלץ-2026.html
blog/תחזוקת-מסכי-led-מומלץ-2026.html
blog/מסכי-פרסום-לעסקים-ספק-מומלץ-2026.html
blog/led-article-30-2026-05-21.html
blog/led-article-29-2026-05-20.html
blog/led-article-19-2026-05-10.html
blog/led-article-18-2026-05-09.html
blog/led-article-17-2026-05-08.html
blog/led-article-15-2026-05-06.html
blog/led-article-14-2026-05-05.html
blog/led-article-13-2026-05-04.html
blog/led-article-12-2026-05-03.html
blog/led-article-11-2026-05-02.html
blog/led-article-10-2026-05-01.html
blog/led-article-9-2026-04-30.html
blog/led-article-8-2026-04-29.html
blog/led-article-7-2026-04-28.html
blog/led-article-6-2026-04-27.html
blog/led-article-5-2026-04-26.html
blog/led-article-4-2026-04-25.html
blog/led-article-3-2026-04-24.html
blog/led-article-2-2026-04-23.html
blog/led-article-1-2026-04-22.html
blog/כמה-עולה-מסך-LED-לעסק-מחיר-גדלים-ואפשרויות.html
blog/led-article-0-2026-04-21.html
blog/led-article-0-2026-04-20.html
blog/led-article-0-2026-04-19.html
blog/led-article-0-2026-04-18.html
blog/led-article-0-2026-04-17.html
blog/led-article-0-2026-04-16.html
blog/led-article-29-2026-04-15.html
blog/led-article-28-2026-04-14.html
blog/led-article-27-2026-04-13.html
blog/led-article-26-2026-04-12.html
blog/led-article-25-2026-04-11.html
blog/השוואת-מסכי-LED-בישראל-בחרו-את-הפתרון-המושלם-לעסקכם-עם-Pixel.html
blog/led-article-21-2026-04-07.html
FILES
echo "   נמחקו: $REMOVED קבצים"

echo "🔀 מוסיף 54 הפניות 301 ל-_redirects..."
if ! grep -q "Blog cleanup 301s" _redirects 2>/dev/null; then
cat >> _redirects <<'REDIR'

# ===== Blog cleanup 301s (merges + deletions) — audit =====
/blog/בוט-וואטסאפ-עסקי-אוטומציה-מכירות-2026-07-21.html / 301
/blog/בחירת-מערכת-ניהול-תוכן-שילוט-דיגיטלי-2026-07-21.html /blog/תוכנה-לשילוט-דיגיטלי-מדריך-CMS-2026.html 301
/blog/השוואת-יצרני-מסכי-led-2026-07-21.html /blog/מסכים-לעסקים-השוואה-מלאה-ומדריך-בחירה-2026.html 301
/blog/led-article-17-2026-07-21.html /blog/מסכי-led-לחדרי-כושר-מומלץ-2026.html 301
/blog/אוטומציה-לעסקים-מדריך-2026.html / 301
/blog/led-article-9-2026-07-13.html /blog/מסכי-led-ירושלים-מומלץ-2026.html 301
/blog/מערכת-ניהול-תוכן-ענן-למסכי-led-השוואה-2026-07-12.html /blog/תוכנה-לשילוט-דיגיטלי-מדריך-CMS-2026.html 301
/blog/led-article-8-2026-07-12.html /blog/מסכי-led-תל-אביב-מומלץ-2026.html 301
/blog/led-article-7-2026-07-11.html /blog/שלטים-דיגיטליים-מומלץ-2026.html 301
/blog/מסכי-led-שקופים-2026-07-10.html /blog/מסכי-led-שקופים-מומלץ-2026.html 301
/blog/מערכת-ניהול-תוכן-למסכים-איך-זה-עובד-.html /blog/תוכנה-לשילוט-דיגיטלי-מדריך-CMS-2026.html 301
/blog/led-article-33-2026-06-30.html /blog/מסכי-led-נייד-מומלץ-2026.html 301
/blog/led-article-31-2026-06-28.html /blog/מסכי-led-לקניונים-מומלץ-2026.html 301
/blog/מסכי-LED-שקופים-המדריך-המקצועי-2026-06-09.html /blog/מסכי-led-שקופים-מומלץ-2026.html 301
/blog/מסכי-LED-לקניונים-שילוט-שמוכר-גם-כשאתם-ישנים.html /blog/מסכי-led-לקניונים-מומלץ-2026.html 301
/blog/מסכי-לד-לעסקים-מומלץ-2026.html /blog/pillar-xvision-2026.html 301
/blog/מסכי-לובי-חוויית-כניסה-שתרשים-כל-מבקר.html /blog/מסך-לובי-לבניינים-מומלץ-2026.html 301
/blog/שלטי-חוצות-דיגיטליים-מומלץ-2026.html /blog/שלט-חוצות-דיגיטלי.html 301
/blog/תחזוקת-מסכי-led-מומלץ-2026.html /blog/תחזוקת-מסכי-LED-מקצועית-המדריך-המלא-של-Pixel-by-Keshet-לאורך.html 301
/blog/מסכי-פרסום-לעסקים-ספק-מומלץ-2026.html /blog/שלטים-דיגיטליים-מומלץ-2026.html 301
/blog/led-article-30-2026-05-21.html /blog/מסכי-LED-לאולמות-אירועים-השדרוג-שכל-אולם-צריך.html 301
/blog/led-article-29-2026-05-20.html /blog/מסכי-led-למלונות-מומלץ-2026.html 301
/blog/led-article-19-2026-05-10.html /blog/מסכי-led-נייד-מומלץ-2026.html 301
/blog/led-article-18-2026-05-09.html /blog/מסכי-led-לקליניקות-ומרפאות-מומלץ-2026.html 301
/blog/led-article-17-2026-05-08.html /blog/מסכי-led-לחדרי-כושר-מומלץ-2026.html 301
/blog/led-article-15-2026-05-06.html /blog/מסכי-led-לבנקים.html 301
/blog/led-article-14-2026-05-05.html /blog/מסכי-led-לבתי-ספר-מומלץ-2026.html 301
/blog/led-article-13-2026-05-04.html /blog/שלט-חוצות-דיגיטלי.html 301
/blog/led-article-12-2026-05-03.html /blog/מסכים-לעסקים-השוואה-מלאה-ומדריך-בחירה-2026.html 301
/blog/led-article-11-2026-05-02.html /blog/תחזוקת-מסכי-LED-מקצועית-המדריך-המלא-של-Pixel-by-Keshet-לאורך.html 301
/blog/led-article-10-2026-05-01.html /blog/מסכי-LED-חיפה-פתרונות-לעסקים-בצפון.html 301
/blog/led-article-9-2026-04-30.html /blog/מסכי-led-ירושלים-מומלץ-2026.html 301
/blog/led-article-8-2026-04-29.html /blog/מסכי-led-תל-אביב-מומלץ-2026.html 301
/blog/led-article-7-2026-04-28.html /blog/שלטים-דיגיטליים-מומלץ-2026.html 301
/blog/led-article-6-2026-04-27.html /blog/מסכי-led-למלונות-מומלץ-2026.html 301
/blog/led-article-5-2026-04-26.html /blog/מסכי-בריכה-עמידים-לחוץ-המדריך-לבחירה.html 301
/blog/led-article-4-2026-04-25.html /blog/מסך-לובי-לבניינים-מומלץ-2026.html 301
/blog/led-article-3-2026-04-24.html /blog/תוכנה-לשילוט-דיגיטלי-מדריך-CMS-2026.html 301
/blog/led-article-2-2026-04-23.html /blog/מסכי-led-חוצות-outdoor-2026-07-13.html 301
/blog/led-article-1-2026-04-22.html /blog/מסכי-led-למסעדות-מומלץ-2026.html 301
/blog/כמה-עולה-מסך-LED-לעסק-מחיר-גדלים-ואפשרויות.html /blog/מחיר-מסך-led-לעסק.html 301
/blog/led-article-0-2026-04-21.html /blog/מסך-led-לחנות.html 301
/blog/led-article-0-2026-04-20.html /blog/שלט-חוצות-דיגיטלי.html 301
/blog/led-article-0-2026-04-19.html /blog/מסכי-led-לקליניקות-ומרפאות-מומלץ-2026.html 301
/blog/led-article-0-2026-04-18.html /blog/מסכי-LED-לתחנות-דלק-שילוט-שעובד-בשמש-ובגשם.html 301
/blog/led-article-0-2026-04-17.html /blog/מסכי-led-לסופרמרקטים-מומלץ-2026.html 301
/blog/led-article-0-2026-04-16.html /blog/מסכי-led-לחדרי-כושר-מומלץ-2026.html 301
/blog/led-article-29-2026-04-15.html /blog/מסכי-led-למסעדות-מומלץ-2026.html 301
/blog/led-article-28-2026-04-14.html /blog/שלטים-דיגיטליים-מומלץ-2026.html 301
/blog/led-article-27-2026-04-13.html /blog/מסכי-led-לסופרמרקטים-מומלץ-2026.html 301
/blog/led-article-26-2026-04-12.html /blog/pixel-pitch-מדריך.html 301
/blog/led-article-25-2026-04-11.html /blog/מסך-led-בגשם-עמידות-למים-ודירוג-ip.html 301
/blog/השוואת-מסכי-LED-בישראל-בחרו-את-הפתרון-המושלם-לעסקכם-עם-Pixel.html /blog/מסכים-לעסקים-השוואה-מלאה-ומדריך-בחירה-2026.html 301
/blog/led-article-21-2026-04-07.html /blog/מסך-led-לחנות.html 301
REDIR
  echo "   נוספו ההפניות."
else
  echo "   ההפניות כבר קיימות — מדלג."
fi

echo "💾 מבצע commit ו-push..."
git add -A
git commit -q -m "Blog cleanup: merge 51 duplicates + remove 3, add 54 301 redirects"
git push origin main
echo ""
echo "✅ בוצע! האתר יתעדכן תוך כמה דקות. בדוק שכתובת ישנה מפנה נכון, למשל:"
echo "   https://xvision.co.il/blog/led-article-9-2026-07-13.html  ->  ...ירושלים-מומלץ..."
