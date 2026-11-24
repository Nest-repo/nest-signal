#!/usr/bin/env python3
"""Creatività dei post LinkedIn — template Nest Signal (cornice fissa, infografica che cambia).

Cornice FISSA: kicker mono · titolo su 2 righe (nero + arancio) · infografica · chiusura su 2 righe (nero + arancio)
· footer con avatar, firma e «SALVA PER DOPO». Crema #eee8de · nero #171717 · arancio #ff4700 · grigio #5c5c5c.
Cambia solo l'infografica centrale (campo "grafico"). 1080×1350, esportata @2x (2160×2700).

  post_creative.py --spec spec.json --out DIR [--scale 2]   -> DIR/creativita.png + DIR/creativita.html

spec.json
{
  "kicker": "FOLLOW-UP / IL MIO SISTEMA",
  "titolo": "Il tuo prossimo cliente è nel CRM", "titolo_arancio": "e ti sei dimenticato di chiamarlo.",
  "chiusura": "...", "chiusura_arancio": "...",   # opzionali: senza, l'infografica prende lo spazio
  "cta": "SALVA PER DOPO",                     # opzionale
  "grafico": {"tipo": "<timeline|barre|prima_dopo|passi|numero>", ...}
}

Tipi di infografica (regole e campi in ../GRAFICI.md): timeline · barre · prima_dopo · passi · flusso · numero.
Regola n.1: VISUALE, non testuale — icone e forme, etichette di 1-2 parole, chiusura opzionale.
"""
import argparse, base64, html, json, os
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from icons import icon_svg, TOOLS  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.join(HERE, "..", "assets")
E = html.escape
CREMA, NERO, ARANCIO, GRIGIO, LINEA = "#eee8de", "#171717", "#ff4700", "#5c5c5c", "#b3ab9f"
MONO = "font-family:'JetBrains Mono',ui-monospace,monospace"
CARD, SOFT, DOTS, TXT2 = "#ffffff", "#e2dbcf", "#cfc7ba", "#3d3d3d"   # superfici e testi secondari
FONT = "'Fractul Variable',Fractul,Outfit,sans-serif"
FONTS_URL = "https://fonts.googleapis.com/css2?family=Outfit:wght@200;300;400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap"
TEMPLATE = None            # HTML del template del cliente (dall'onboarding Creatività)
L, R = 72, 1008            # margini orizzontali
G_TOP, G_BOT = 300, 880    # area infografica


def uri(name):
    p = os.path.join(ASSETS, name)
    mt = "image/svg+xml" if p.endswith(".svg") else "image/jpeg" if p.endswith((".jpg", ".jpeg")) else "image/png"
    return f"data:{mt};base64,{base64.b64encode(open(p, 'rb').read()).decode()}"


def abs_(x, y, w, inner, h=None, extra=""):
    hh = f"height:{h}px;" if h else ""
    return f'<div style="position:absolute;left:{x}px;top:{y}px;width:{w}px;{hh}{extra}">{inner}</div>'


def mono(text, size=15, color=None, weight=400, ls=".06em", extra=""):
    color = color or TXT2
    return f'<span style="{MONO};font-size:{size}px;font-weight:{weight};letter-spacing:{ls};color:{color};{extra}">{E(text)}</span>'


# ---------- cornice ----------
def kicker(s):
    return abs_(L, 58, 900, f'<div style="display:flex;align-items:center;gap:12px"><div style="width:9px;height:9px;background:{NERO}"></div>{mono(s["kicker"].upper(), 17, "#3d3d3d", 400, ".07em")}</div>')


def two_lines(a, b, size, top, weight=300):
    # classe "fit": lo script in pagina riduce la dimensione finché entrambe le righe stanno su una riga sola
    st = f"line-height:1.08;font-weight:{weight};letter-spacing:-.035em;white-space:nowrap"
    return abs_(L, top, R - L, f'<div class="fit" style="font-size:{size}px"><div style="{st};color:{NERO}">{E(a)}</div><div style="{st};color:{ARANCIO}">{E(b)}</div></div>', extra="overflow:visible")


def title_size(s):
    return 64   # massimo: lo script .fit riduce se una riga non entra


def closing_size(s):
    return 74


AUTORE = {"nome": "", "ruolo": "", "avatar": ""}


def avatar_uri():
    p = AUTORE.get("avatar") or ""
    if p and os.path.exists(p):
        mt = "image/png" if p.endswith(".png") else "image/jpeg"
        return f"data:{mt};base64,{base64.b64encode(open(p, 'rb').read()).decode()}"
    # senza foto: cerchio col colore d'accento e le iniziali
    ini = "".join(w[0] for w in (AUTORE.get("nome") or "?").split()[:2]).upper()
    svg = f'<svg xmlns="http://www.w3.org/2000/svg" width="56" height="56"><circle cx="28" cy="28" r="28" fill="{ARANCIO}"/><text x="28" y="36" font-family="sans-serif" font-size="22" fill="#fff" text-anchor="middle">{E(ini)}</text></svg>'
    return "data:image/svg+xml;base64," + base64.b64encode(svg.encode()).decode()


def footer(s):
    bookmark = f'<svg width="18" height="22" viewBox="0 0 18 22"><path d="M2 2h14v18l-7-5-7 5z" fill="none" stroke="{NERO}" stroke-width="2" stroke-linejoin="round"/></svg>'
    left = (f'<div style="display:flex;align-items:center;gap:18px"><img src="{avatar_uri()}" style="width:56px;height:56px;border-radius:50%;object-fit:cover">'
            f'<div style="display:flex;flex-direction:column;gap:2px"><span style="font-size:21px;font-weight:600;letter-spacing:-.01em">{E(AUTORE.get("nome", ""))}</span>'
            f'<span style="font-size:17px;color:{GRIGIO}">{E(AUTORE.get("ruolo", ""))}</span></div></div>')
    right = f'<div style="display:flex;align-items:center;gap:12px">{bookmark}{mono(s.get("cta", "SALVA PER DOPO"), 16, NERO, 500, ".08em")}</div>'
    return abs_(L, 1240, R - L, f'<div style="border-top:1.5px solid #d6cfc3;padding-top:22px;display:flex;justify-content:space-between;align-items:center">{left}{right}</div>')


def didascalia(g, x=None, y=None):
    y = G_TOP + 32 if y is None else y
    x = L + 258 if x is None else x
    return abs_(x, y, R - x, mono(g["didascalia"].upper(), 14, TXT2, 400, ".07em")) if g.get("didascalia") else ""


# ---------- grafici (VISUALI: icone e forme, etichette di 1-2 parole) ----------
def icon_box(name, size=56, fg=None, bg=None, radius=None, ring=None):
    fg = fg or NERO; bg = bg or CARD
    if name in TOOLS and bg not in (ARANCIO,):
        bg = "#ffffff"  # i loghi dei tool hanno colori propri: su fondo scuro sparirebbero
    """Icona in un riquadro. Tool veri (notion, slack, gmail, n8n, claude) = logo; altrimenti icona line-art."""
    r = radius if radius is not None else size // 4
    inner = (f'<img src="{uri(name + ".svg")}" style="width:{int(size * .55)}px;height:{int(size * .55)}px;object-fit:contain">'
             if name in TOOLS else icon_svg(name, int(size * .52), fg))
    bd = f"box-shadow:inset 0 0 0 2.5px {ring};" if ring else ""
    return (f'<div style="width:{size}px;height:{size}px;border-radius:{r}px;background:{bg};{bd}display:flex;'
            f'align-items:center;justify-content:center;flex:none">{inner}</div>')


def label(text, size=22, color=None, weight=600, align="center", w=None):
    color = color or NERO
    ww = f"width:{w}px;" if w else ""
    return f'<div style="{ww}text-align:{align};font-size:{size}px;line-height:1.15;font-weight:{weight};letter-spacing:-.01em;color:{color}">{E(text)}</div>'


def svg_wrap(parts):
    return f'<svg style="position:absolute;left:0;top:0;overflow:visible" width="1080" height="1350">{"".join(parts)}</svg>'


def arrow(x1, y1, x2, y2, color=None, w=2.6, head=12, dash=None):
    color = color or ARANCIO
    import math
    a = math.atan2(y2 - y1, x2 - x1); d = f' stroke-dasharray="{dash}"' if dash else ""
    hx1, hy1 = x2 - head * math.cos(a - .5), y2 - head * math.sin(a - .5)
    hx2, hy2 = x2 - head * math.cos(a + .5), y2 - head * math.sin(a + .5)
    return (f'<path d="M{x1:.1f} {y1:.1f} L{x2:.1f} {y2:.1f}" stroke="{color}" stroke-width="{w}" fill="none" stroke-linecap="round"{d}/>'
            f'<path d="M{hx1:.1f} {hy1:.1f} L{x2:.1f} {y2:.1f} L{hx2:.1f} {hy2:.1f}" stroke="{color}" stroke-width="{w}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>')


def g_timeline(g):
    """Il template originale: righe (icona + 1-2 parole) con una traccia nel tempo; pillola verticale arancio."""
    righe = g["righe"]; n = len(righe)
    x0, x1 = L + 258, (R - 83) if g.get("pillola") else (R - 18)
    y0 = G_TOP + 130; step = min(170, (G_BOT - y0) // max(n - 1, 1)) if n > 1 else 0
    svg, html_ = [], [didascalia(g)]
    for i, r in enumerate(righe):
        y = y0 + i * step
        svg.append(f'<line x1="{x0}" y1="{y}" x2="{x1 - 4}" y2="{y}" stroke="{LINEA}" stroke-width="2"/>')
        svg.append(f'<path d="M{x1 - 26} {y - 11} L{x1 - 4} {y} L{x1 - 26} {y + 11} M{x1 - 32} {y} L{x1 - 4} {y}" stroke="{ARANCIO}" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>')
        ico = icon_box(r["icona"], 48, NERO, CARD, 12) if r.get("icona") else ""
        sub = f'<div style="font-size:16px;line-height:21px;color:{GRIGIO};margin-top:6px">{E(r["testo"])}</div>' if r.get("testo") else ""
        html_.append(abs_(L, y - 24, 245, f'<div style="display:flex;align-items:center;gap:14px">{ico}<span style="font-size:26px;font-weight:600;letter-spacing:-.015em">{E(r["titolo"])}</span></div>{sub}'))
        if r.get("serie"):
            k = r["serie"]["n"]; span = (x1 - 40 - x0 - 20)
            for j in range(k):
                svg.append(f'<circle cx="{x0 + 20 + span * j / max(k - 1, 1):.1f}" cy="{y}" r="6" fill="{NERO}"/>')
            if r["serie"].get("etichetta"):
                html_.append(abs_(x0 + 8, y + 20, 400, mono(r["serie"]["etichetta"], 13, TXT2, 400, ".02em")))
        for ev in r.get("eventi", []):
            cx = x0 + 20 + (x1 - 60 - x0) * ev["x"]; t = ev.get("tipo", "grande")
            if t == "grande":
                svg.append(f'<circle cx="{cx:.1f}" cy="{y}" r="10" fill="{ARANCIO}"/>')
            elif t == "piccolo":
                svg.append(f'<circle cx="{cx:.1f}" cy="{y}" r="6" fill="{NERO}"/>')
            else:
                svg.append(f'<circle cx="{cx:.1f}" cy="{y}" r="15" fill="{CREMA}" stroke="{ARANCIO}" stroke-width="2.6"/><circle cx="{cx:.1f}" cy="{y}" r="5" fill="{ARANCIO}"/>')
            if ev.get("etichetta"):
                ly = y - 44 if ev.get("sopra") else y + 18
                html_.append(abs_(int(cx - 90), ly, 180, f'<div style="text-align:center">{mono(ev["etichetta"], 13, NERO if ev.get("sopra") else TXT2, 400, ".02em")}</div>'))
    if g.get("pillola"):
        top, bot = y0 - 50, y0 + step * (n - 1) + 50
        html_.append(abs_(R - 77, top, 76, f'<div style="width:76px;height:{bot - top}px;border-radius:38px;background:{ARANCIO};display:flex;align-items:center;justify-content:center">'
                                        f'<span style="{MONO};font-size:17px;font-weight:600;letter-spacing:.1em;color:{NERO};writing-mode:vertical-rl;transform:rotate(180deg);white-space:nowrap">{E(g["pillola"].upper())}</span></div>'))
    return svg_wrap(svg) + "".join(html_)


def g_barre(g):
    """Barre spesse con icona: si capisce chi è più grande senza leggere. Valore grande in fondo alla barra."""
    righe = g["righe"]; n = len(righe); mx = max(r["valore"] for r in righe) or 1
    step = min(120, (G_BOT - G_TOP - 120) // n); y0 = G_TOP + 120 + ((G_BOT - G_TOP - 120) - step * n) // 2
    out = [didascalia(g, L)]
    for i, r in enumerate(righe):
        y = y0 + i * step; ev = r.get("evidenza"); col = ARANCIO if ev else NERO
        w = int(520 * r["valore"] / mx); val = f'{r["valore"]:g}{g.get("unita", "")}'
        out.append(abs_(L, y, 300, f'<div style="display:flex;align-items:center;gap:16px">{icon_box(r.get("icona", "orologio"), 64, CARD if ev else NERO, ARANCIO if ev else CARD, 16)}'
                                   f'{label(r["etichetta"], 22, col, 600, "left", 210)}</div>'))
        out.append(abs_(L + 298, y + 10, R - L - 300, f'<div style="display:flex;align-items:center;gap:18px"><div style="width:{max(w, 14)}px;height:44px;border-radius:22px;background:{col}"></div>'
                                          f'<span style="font-size:40px;font-weight:300;letter-spacing:-.03em;color:{col}">{E(val)}</span></div>'))
    return "".join(out)


def g_prima_dopo(g):
    """Prima = una persona sommersa da fili aggrovigliati. Dopo = gli stessi pezzi in fila che arrivano al risultato."""
    pr, do = g["prima"], g["dopo"]; top = G_TOP + 70; H = 540
    out = [didascalia(g, L)]; svg = []
    # pannello PRIMA (tratteggiato)
    px, pw = L, int((R - L - 80) * 0.52); cx, cy = px + pw / 2, top + 300
    bg = [abs_(px, top, pw, f'<div style="border:1.5px dashed {LINEA};border-radius:24px;height:{H}px;box-sizing:border-box"></div>')]
    out.append(abs_(px + 30, top + 26, 300, mono(pr.get("titolo", "Prima").upper(), 15, TXT2, 600, ".08em")))
    pos = [(-150, -150), (130, -165), (-165, 40), (150, 60), (-40, 175), (60, -190)]
    for i, v in enumerate(pr["voci"][:6]):
        dx, dy = pos[i]; ix, iy = cx + dx, cy + dy
        c1x, c1y = ix + (dy * .6), iy - (dx * .4); c2x, c2y = cx - dy * .5, cy + dx * .5
        svg.append(f'<path d="M{ix:.0f} {iy:.0f} C{c1x:.0f} {c1y:.0f} {c2x:.0f} {c2y:.0f} {cx:.0f} {cy:.0f}" stroke="{LINEA}" stroke-width="2" fill="none" stroke-dasharray="5 6"/>')
        out.append(abs_(int(ix - 60), int(iy - 28), 120, f'<div style="display:flex;flex-direction:column;align-items:center;gap:6px">{icon_box(v["icona"], 56, GRIGIO, CARD, 14)}'
                                                         f'{mono(v.get("etichetta", ""), 13, GRIGIO, 500, ".02em")}</div>'))
    out.append(abs_(int(cx - 46), int(cy - 46), 92, f'<div style="position:relative">{icon_box(pr.get("centro", "persona"), 92, NERO, SOFT, 46)}'
                                                    f'<div style="position:absolute;right:-4px;top:-4px;width:30px;height:30px;border-radius:50%;background:{ARANCIO};color:#fff;'
                                                    f'display:flex;align-items:center;justify-content:center;{MONO};font-weight:600;font-size:18px">!</div></div>'))
    # freccia centrale
    svg.append(arrow(L + pw + 14, top + H / 2, L + pw + 66, top + H / 2, ARANCIO, 3, 14))
    # pannello DOPO (bianco, ordinato)
    dx0 = L + pw + 80; dw = R - dx0
    bg.append(abs_(dx0, top, dw, f'<div style="background:{CARD};border-radius:24px;height:{H}px"></div>'))
    out.append(abs_(dx0 + 30, top + 26, 300, mono(do.get("titolo", "Dopo").upper(), 15, ARANCIO, 600, ".08em")))
    voci = do["voci"][:4]; n = len(voci); ix = dx0 + 70; sy = top + 100
    st = 92 if n <= 3 else 78
    for i, v in enumerate(voci):
        yy = sy + st * i
        out.append(abs_(ix - 28, int(yy), 330, f'<div style="display:flex;align-items:center;gap:16px">{icon_box(v["icona"], 56, NERO, CREMA, 14)}'
                                               f'{label(v.get("etichetta", ""), 19, NERO, 600, "left", 250)}</div>'))
        if i < n - 1:
            svg.append(f'<line x1="{ix}" y1="{yy + 60:.0f}" x2="{ix}" y2="{yy + st - 4:.0f}" stroke="{NERO}" stroke-width="2"/>')
    res = do.get("risultato")
    if res:
        ry = sy + st * n + 6
        svg.append(arrow(ix, sy + st * (n - 1) + 60, ix, ry - 4, ARANCIO, 2.6, 11))
        out.append(abs_(ix - 44, int(ry), 340, f'<div style="display:flex;align-items:center;gap:18px">{icon_box(res["icona"], 88, CARD, ARANCIO, 44)}'
                                              f'{label(res.get("etichetta", ""), 22, ARANCIO, 600, "left", 210)}</div>'))
    return "".join(bg) + svg_wrap(svg) + "".join(out)


def g_passi(g):
    """Sequenza di cerchi con icona, frecce tra un passo e l'altro, 1-2 parole sotto. L'ultimo (o quello in evidenza) è arancio."""
    p = g["passi"]; n = len(p); w = (R - L) / n; y = (G_TOP + G_BOT) // 2 - 30; d = 124 if n <= 4 else 104
    svg, out = [], [didascalia(g, L)]
    for i, s in enumerate(p):
        cx = L + w * i + w / 2; ev = s.get("evidenza")
        if i < n - 1:
            svg.append(arrow(cx + d / 2 + 14, y, cx + w - d / 2 - 14, y, LINEA if not p[i + 1].get("evidenza") else ARANCIO, 2.4, 11))
        out.append(abs_(int(cx - d / 2), int(y - d / 2 - 40), d, f'<div style="text-align:center">{mono(f"{i + 1:02d}", 14, ARANCIO if ev else TXT2, 600)}</div>'))
        out.append(abs_(int(cx - d / 2), int(y - d / 2), d, icon_box(s["icona"], d, CARD if ev else NERO, ARANCIO if ev else CARD, d // 2)))
        out.append(abs_(int(cx - w / 2 + 6), int(y + d / 2 + 18), int(w - 12), label(s["titolo"], 23, ARANCIO if ev else NERO)))
    return svg_wrap(svg) + "".join(out)


def g_flusso(g):
    """Ingressi (icone) che confluiscono in un sistema al centro e ne esce un risultato arancio."""
    ins = g["ingressi"][:4]; n = len(ins); hub, res = g["sistema"], g["risultato"]
    my = (G_TOP + G_BOT) // 2 + 10; svg, out = [], [didascalia(g, L)]
    hx, hr = (L + R) // 2 + 20, 88; rx = R - 80
    st = min(150, (G_BOT - G_TOP - 120) / max(n, 1))
    for i, v in enumerate(ins):
        y = my + (i - (n - 1) / 2) * st
        out.append(abs_(L + 20, int(y - 34), 68, icon_box(v["icona"], 68, NERO, CARD, 18)))
        out.append(abs_(L - 26, int(y + 40), 160, label(v.get("etichetta", ""), 18, NERO)))
        svg.append(f'<path d="M{L + 96} {y:.0f} C{hx - 170} {y:.0f} {hx - 170} {my} {hx - hr - 8} {my}" stroke="{NERO}" stroke-width="2" fill="none"/>')
    svg.append(f'<circle cx="{hx - hr - 8}" cy="{my}" r="5" fill="{NERO}"/>')
    out.append(abs_(hx - hr, my - hr, hr * 2, f'<div style="width:{hr * 2}px;height:{hr * 2}px;border-radius:50%;background:{CARD};box-shadow:inset 0 0 0 2.5px {NERO};display:flex;align-items:center;justify-content:center">'
                                               f'{icon_box(hub["icona"], 96, NERO, CARD, 24)}</div>'))
    out.append(abs_(hx - 120, my + hr + 16, 240, label(hub.get("etichetta", ""), 21, NERO)))
    svg.append(arrow(hx + hr + 12, my, rx - 82, my, ARANCIO, 3, 15))
    out.append(abs_(rx - 72, my - 72, 144, icon_box(res["icona"], 144, CARD, ARANCIO, 72)))
    out.append(abs_(rx - 110, my + 88, 220, label(res.get("etichetta", ""), 22, ARANCIO)))
    return svg_wrap(svg) + "".join(out)


def g_numero(g):
    """Un numero grande + la sua forma: griglia di pallini (es. 77 su 240) o barre di confronto."""
    out = [didascalia(g, L),
           abs_(L, G_TOP + 110, 520, f'<div style="font-size:200px;line-height:.85;font-weight:300;letter-spacing:-.06em;color:{ARANCIO}">{E(str(g["numero"]))}</div>'
                                     f'<div style="{MONO};font-size:18px;letter-spacing:.07em;margin-top:22px">{E(g.get("unita", "").upper())}</div>')]
    pt = g.get("punti")
    if pt:
        tot, hi = min(int(pt["totale"]), 400), int(pt["evidenza"] * min(1, 400 / pt["totale"]))
        cols = 16 if tot > 160 else 12 if tot > 60 else 8
        gap = 400 / cols; rows = -(-tot // cols); r = gap * .3
        y0 = (G_TOP + G_BOT) / 2 - rows * gap / 2 + 20
        dots = [f'<circle cx="{L + 528 + gap * (k % cols) + gap / 2:.1f}" cy="{y0 + gap * (k // cols):.1f}" r="{r:.1f}" fill="{ARANCIO if k < hi else DOTS}"/>' for k in range(tot)]
        out.append(svg_wrap(dots))
        if pt.get("legenda"):
            out.append(abs_(L + 528, int(y0 + gap * rows + 6), 400, mono(pt["legenda"], 13, TXT2, 400, ".03em")))
    for i, c in enumerate(g.get("confronto") or []):
        mx = max(x["valore"] for x in g["confronto"]) or 1; col = ARANCIO if c.get("evidenza") else NERO
        y = G_TOP + 150 + i * 110; v = f'{c["valore"]:g}'
        out.append(abs_(L + 548, y, R - L - 548, f'<div style="display:flex;align-items:center;gap:12px">{icon_box(c.get("icona", "grafico"), 44, col, CARD, 12)}{label(c["etichetta"], 18, col, 600, "left")}</div>'
                                     f'<div style="display:flex;align-items:center;gap:12px;margin-top:12px"><div style="width:{int(290 * c["valore"] / mx)}px;height:28px;border-radius:14px;background:{col}"></div>'
                                     f'<span style="font-size:30px;font-weight:300;color:{col}">{E(v)}</span></div>'))
    return "".join(out)


GRAFICI = {"timeline": g_timeline, "barre": g_barre, "prima_dopo": g_prima_dopo, "passi": g_passi, "flusso": g_flusso, "numero": g_numero}


FIT_JS = """<script>
window.__fit = async () => {
  await document.fonts.ready;
  for (const el of document.querySelectorAll('.fit')) {
    let s = parseFloat(getComputedStyle(el).fontSize);
    const max = el.parentElement.clientWidth;
    while (s > 24 && [...el.children].some(c => c.scrollWidth > max)) { s -= 1; el.style.fontSize = s + 'px'; }
  }
  return true;
};
</script>"""


def page_template(s, body):
    """Template del cliente: HTML con segnaposto {{…}} scritto dall'onboarding Creatività."""
    slots = {
        "KICKER": E(s.get("kicker", "")), "TITOLO": E(s.get("titolo", "")), "TITOLO_ACCENTO": E(s.get("titolo_arancio", "")),
        "CHIUSURA": E(s.get("chiusura", "")), "CHIUSURA_ACCENTO": E(s.get("chiusura_arancio", "")),
        "NOME": E(AUTORE.get("nome", "")), "RUOLO": E(AUTORE.get("ruolo", "")), "AVATAR": avatar_uri(), "CTA": E(s.get("cta", "Salva per dopo")),
        "LOGO": AUTORE.get("logo_uri", ""), "INFOGRAFICA": body,
    }
    h = TEMPLATE
    for k, v in slots.items():
        h = h.replace("{{" + k + "}}", v)
    hide = ".solo-chiusura{display:none!important}" if not s.get("chiusura") else ".solo-senza-chiusura{display:none!important}"
    extra = f'<link href="{FONTS_URL}" rel="stylesheet"><style>html,body{{margin:0;padding:0}} {hide}</style>{FIT_JS}'
    h = h.replace("</head>", extra + "</head>", 1) if "</head>" in h else extra + h
    return h


def page(s):
    ts, cs = title_size(s), closing_size(s)
    g = s["grafico"]
    body = GRAFICI[g["tipo"]](g)
    if TEMPLATE:
        return page_template(s, body)
    if not s.get("chiusura"):
        # niente frase di chiusura: l'infografica occupa anche quello spazio (più grande e più in basso)
        body = f'<div style="position:absolute;left:0;top:0;width:1080px;height:1350px;transform:translateY(110px)">{body}</div>'
    return f'''<!doctype html><html><head><meta charset="utf-8">
<link href="{FONTS_URL}" rel="stylesheet">
<style>html,body{{margin:0;padding:0}}</style>
{FIT_JS}</head><body>
<div id="c" style="position:relative;width:1080px;height:1350px;overflow:hidden;background:{CREMA};font-family:{FONT};color:{NERO}">
{kicker(s)}{two_lines(s["titolo"], s["titolo_arancio"], ts, 104)}
{body}
{two_lines(s["chiusura"], s.get("chiusura_arancio", ""), cs, 930) if s.get("chiusura") else ""}
{footer(s)}
</div></body></html>'''


def screenshot(html_path, png_path, scale):
    """Screenshot con Playwright per Python se c'è, altrimenti con Playwright per Node (script del kit)."""
    try:
        from playwright.sync_api import sync_playwright
        with sync_playwright() as pw:
            b = pw.chromium.launch()
            p = b.new_page(viewport={"width": 1080, "height": 1350}, device_scale_factor=scale)
            p.goto("file://" + os.path.abspath(html_path), wait_until="networkidle"); p.evaluate("window.__fit()"); p.wait_for_timeout(300)
            p.locator("#c").screenshot(path=png_path); b.close()
    except ImportError:
        import subprocess
        node_script = os.path.join(HERE, "..", "..", "scripts", "screenshot.mjs")
        subprocess.run(["node", node_script, os.path.abspath(html_path), os.path.abspath(png_path), str(scale)], check=True)


def load_tokens(tk, s):
    """Token del brand: colori, font, area dell'infografica (con e senza chiusura)."""
    global CREMA, NERO, ARANCIO, GRIGIO, LINEA, CARD, SOFT, DOTS, TXT2, FONT, MONO, FONTS_URL, L, R, G_TOP, G_BOT
    c = tk.get("colori", {})
    CREMA, NERO, ARANCIO = c.get("sfondo", CREMA), c.get("testo", NERO), c.get("accento", ARANCIO)
    GRIGIO, LINEA, CARD = c.get("testo_secondario", GRIGIO), c.get("linee", LINEA), c.get("superficie", CARD)
    SOFT, DOTS, TXT2 = c.get("superficie_2", SOFT), c.get("inattivo", DOTS), c.get("etichette", TXT2)
    f = tk.get("font", {})
    if f.get("titoli") or f.get("testo"):
        FONT = f"'{f.get('testo') or f.get('titoli')}',sans-serif"
    if f.get("etichette"):
        MONO = f"font-family:'{f['etichette']}',ui-monospace,monospace"
    FONTS_URL = tk.get("google_fonts_url", FONTS_URL)
    area = tk.get("area_senza_chiusura" if not s.get("chiusura") and tk.get("area_senza_chiusura") else "area", {})
    L, R, G_TOP, G_BOT = area.get("left", L), area.get("right", R), area.get("top", G_TOP), area.get("bottom", G_BOT)
    if tk.get("logo") and os.path.exists(tk["logo"]):
        p = tk["logo"]; mt = "image/svg+xml" if p.endswith(".svg") else "image/png" if p.endswith(".png") else "image/jpeg"
        AUTORE["logo_uri"] = f"data:{mt};base64,{base64.b64encode(open(p, 'rb').read()).decode()}"


def main():
    global CREMA, NERO, ARANCIO, TEMPLATE
    ap = argparse.ArgumentParser()
    ap.add_argument("--spec", required=True); ap.add_argument("--out", required=True)
    ap.add_argument("--config", help="CONFIG di Nest Signal: autore, foto e colori del brand")
    ap.add_argument("--scale", type=float, default=2)
    ap.add_argument("--template", help="template HTML del cliente (DATA/creative/template.html)")
    ap.add_argument("--tokens", help="token del brand del cliente (DATA/creative/tokens.json)")
    a = ap.parse_args()
    s = json.load(open(a.spec))
    if a.config and os.path.exists(a.config):
        c = json.load(open(a.config))
        o, br = c.get("owner", {}), c.get("brand", {})
        AUTORE.update({"nome": o.get("name", ""), "ruolo": o.get("role", ""), "avatar": o.get("avatar", "")})
        CREMA, NERO, ARANCIO = br.get("bg", CREMA), br.get("ink", NERO), br.get("accent", ARANCIO)
    AUTORE.update(s.get("autore", {}))
    if a.tokens and os.path.exists(a.tokens):
        load_tokens(json.load(open(a.tokens)), s)
    if a.template and os.path.exists(a.template):
        TEMPLATE = open(a.template).read()
    os.makedirs(a.out, exist_ok=True)
    hp, pp = os.path.join(a.out, "creativita.html"), os.path.join(a.out, "creativita.png")
    open(hp, "w").write(page(s))
    screenshot(hp, pp, a.scale)
    print(pp)


if __name__ == "__main__":
    main()
