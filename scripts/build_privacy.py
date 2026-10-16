#!/usr/bin/env python3
"""Write the privacy policy and support page for the web from src/content/privacy.json,
so the in-app policy, docs/PRIVACY.md and the pages linked from the App Store listing
always say the same thing.

  docs/PRIVACY.md            the policy, in the repo
  site/index.html            support page   (https://anvakondak.github.io/wild-nyc/)
  site/privacy/index.html    privacy policy (https://anvakondak.github.io/wild-nyc/privacy/)

site/ is published by .github/workflows/pages.yml on every push to main.

Run from the repo root:  python3 scripts/build_privacy.py
"""
import html, json, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
p = json.load(open(os.path.join(ROOT, "src/content/privacy.json")))
CONTACT = p.get("contact") or "the email on our App Store page"

# docs/PRIVACY.md
lines = [f"# Wild Neighbors {p['title']}", "", "**We notice. We don't follow.**", "", f"_Updated {p['updated']}_", "", p["summary"], ""]
for s in p["sections"]:
    lines += [f"## {s['heading']}", "", s["body"].replace("{contact}", CONTACT), ""]
open(os.path.join(ROOT, "docs/PRIVACY.md"), "w").write("\n".join(lines))

# The web pages: the app's riso look (paper, ink, offset shadows, Fraunces + Instrument Sans).
STYLE = """
:root { --paper: #FAF7F2; --ink: #1A1A2E; --soft: #3B3A50; --muted: #55546A; --pink: #FF6B9A; --pink-tint: #FFE3EC; --blue: #2F5BEA; --yellow: #FFD23F; --card: #FFFFFF; }
* { box-sizing: border-box; }
body { margin: 0; background: var(--paper); color: var(--soft); font: 17px/1.6 'Instrument Sans', -apple-system, 'Segoe UI', Roboto, sans-serif; }
main { max-width: 680px; margin: 0 auto; padding: 40px 20px 64px; display: grid; gap: 24px; }
.brand { font-family: 'Fraunces', Georgia, serif; font-weight: 600; font-size: 22px; color: var(--ink); text-decoration: none; }
.brand em { color: var(--pink); }
h1 { font-family: 'Fraunces', Georgia, serif; font-weight: 600; font-size: clamp(34px, 8vw, 46px); line-height: 1.1; color: var(--ink); margin: 0; text-shadow: 3px 3px 0 var(--yellow); text-wrap: balance; }
h1 em { color: var(--pink); }
h2 { font-family: 'Fraunces', Georgia, serif; font-weight: 600; font-size: 22px; color: var(--ink); margin: 0 0 4px; }
p { margin: 0; }
.motto { font-family: 'Fraunces', Georgia, serif; font-style: italic; font-size: 19px; color: var(--ink); }
.muted { color: var(--muted); font-size: 15px; }
.card { background: var(--card); border: 1.5px solid var(--ink); border-radius: 20px; padding: 20px; box-shadow: 5px 5px 0 var(--pink); display: grid; gap: 8px; }
.card.blue { box-shadow: 5px 5px 0 var(--blue); }
section { display: grid; gap: 4px; }
a { color: var(--blue); }
.email { font-weight: 600; font-size: 19px; overflow-wrap: anywhere; }
footer { border-top: 1.5px solid var(--ink); padding-top: 16px; display: flex; gap: 18px; flex-wrap: wrap; }
footer a { min-height: 44px; display: inline-flex; align-items: center; }
"""


def page(title, body):
    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{html.escape(title)}</title>
<meta name="description" content="Wild Neighbors: meet the everyday animals on your block in NYC and Jersey City.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,600;1,9..144,600&family=Instrument+Sans:wght@400;600&display=swap">
<style>{STYLE}</style>
</head>
<body>
<main>
<a class="brand" href="{'../' if 'Privacy' in title else './'}">Wild <em>Neighbors</em></a>
{body}
</main>
</body>
</html>
"""


email = html.escape(CONTACT)
mail = f'<a class="email" href="mailto:{email}">{email}</a>' if p.get("contact") else email
footer = '<footer><a href="{home}">Support</a><a href="{privacy}">Privacy policy</a></footer>'

sections = "\n".join(
    f"<section><h2>{html.escape(s['heading'])}</h2><p>{html.escape(s['body']).replace('{contact}', mail)}</p></section>" for s in p["sections"]
)
privacy = page(
    "Wild Neighbors Privacy",
    f"""<h1>Privacy</h1>
<p class="motto">We notice. We don't follow.</p>
<p class="muted">Updated {html.escape(p['updated'])}</p>
<div class="card"><p>{html.escape(p['summary'])}</p></div>
{sections}
{footer.format(home='../', privacy='./')}""",
)

FAQ = [
    ("Where does the app work?", "In New York City (all five boroughs) and Jersey City. You pick your neighborhood from a list; the app never asks where you are."),
    ("How do I change my neighborhood?", "Your neighborhoods are the pills at the top of the home screen: tap one to switch, “+” to add another, or the pencil on Home to move it."),
    ("How do I pick favorites?", "Tap the heart on any neighbor's page, or on the favorites step when you join. Your favorites get their own story every day."),
    ("How do I turn the sound off?", "Tap the speaker on the home screen. The sound is calm forest birdsong, and it stays off until you turn it back on."),
    ("I found a hurt animal. What do I do?", "Open the Kindness tab and tap “Found a hurt animal?” for who to call in NYC and Jersey City. Please don't pick up a wild animal unless a rehabber tells you to."),
    ("Can I delete my data?", "Everything the app keeps lives only on your phone. Deleting the app deletes all of it. There's no account to close."),
]
faq = "\n".join(f"<section><h2>{html.escape(q)}</h2><p>{html.escape(a)}</p></section>" for q, a in FAQ)
support = page(
    "Wild Neighbors Support",
    f"""<h1>Meet the <em>neighbors</em></h1>
<p>Wild Neighbors is a little iOS app about the everyday animals on your block in NYC and Jersey City: what the pigeons, sparrows, squirrels and crows near you are up to right now.</p>
<div class="card blue"><h2>Questions, ideas or a bug?</h2><p>Write to {mail}. A real person reads every note.</p></div>
{faq}
{footer.format(home='./', privacy='privacy/')}""",
)

os.makedirs(os.path.join(ROOT, "site/privacy"), exist_ok=True)
open(os.path.join(ROOT, "site/privacy/index.html"), "w").write(privacy)
open(os.path.join(ROOT, "site/index.html"), "w").write(support)
print("docs/PRIVACY.md, site/index.html, site/privacy/index.html")
