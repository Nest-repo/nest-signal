"""Icone line-art per le creatività (24×24, tratto 2, angoli tondi): stesso segno sottile del template.

icon_svg(nome, size, colore) -> <svg> inline. Nomi disponibili: ICONS.keys().
Per i tool veri (notion, slack, gmail, n8n, claude) si usano i loghi in assets/ (vedi post_creative.icon_box).
"""

ICONS = {
    "persona": '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/>',
    "team": '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6.5 6.5-6.5s6.5 2.9 6.5 6.5"/><circle cx="17" cy="9" r="2.8"/><path d="M16.5 13.6c2.9.2 5 2.6 5 5.4"/>',
    "telefono": '<path d="M5 3.5h3.5l2 5-2.4 1.6a11 11 0 0 0 5.8 5.8l1.6-2.4 5 2V19a2 2 0 0 1-2 2A16.5 16.5 0 0 1 3 5.5a2 2 0 0 1 2-2z"/>',
    "orologio": '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.2 2"/>',
    "sveglia": '<circle cx="12" cy="13" r="7.5"/><path d="M12 9.5V13l2.4 1.6M4.5 4 2.5 6M19.5 4l2 2"/>',
    "calendario": '<rect x="3" y="5" width="18" height="16" rx="2.5"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    "mail": '<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="m3.5 7 8.5 6 8.5-6"/>',
    "chat": '<path d="M20.5 12a8.5 8.5 0 0 1-12.3 7.6L3.5 21l1.4-4.6A8.5 8.5 0 1 1 20.5 12z"/>',
    "documento": '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/>',
    "lista": '<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1.2" fill="currentColor"/><circle cx="4.5" cy="12" r="1.2" fill="currentColor"/><circle cx="4.5" cy="18" r="1.2" fill="currentColor"/>',
    "check": '<path d="m4.5 12.5 5 5L19.5 7"/>',
    "allerta": '<path d="M12 3.5 21.5 20h-19z"/><path d="M12 10v4.5"/><circle cx="12" cy="17.3" r=".9" fill="currentColor"/>',
    "domanda": '<circle cx="12" cy="12" r="9"/><path d="M9.6 9.3a2.5 2.5 0 1 1 3.4 2.3c-.6.3-1 .9-1 1.6v.6"/><circle cx="12" cy="16.8" r=".9" fill="currentColor"/>',
    "euro": '<path d="M17.5 6.2a7 7 0 1 0 0 11.6"/><path d="M4 10h9M4 14h9"/>',
    "grafico": '<path d="M4 3.5v16.5h16.5"/><path d="M8.5 16v-4M13 16V8M17.5 16v-6"/>',
    "crescita": '<path d="M3.5 17 9.5 11l4 4 7-7.5"/><path d="M15 7.5h5.5V13"/>',
    "calo": '<path d="M3.5 7 9.5 13l4-4 7 7.5"/><path d="M15 16.5h5.5V11"/>',
    "ingranaggio": '<circle cx="12" cy="12" r="3.3"/><path d="M12 2.8v2.6M12 18.6v2.6M2.8 12h2.6M18.6 12h2.6M5.5 5.5l1.9 1.9M16.6 16.6l1.9 1.9M5.5 18.5l1.9-1.9M16.6 7.4l1.9-1.9"/>',
    "lampadina": '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1 2V16h5.2v-.2c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z"/>',
    "database": '<ellipse cx="12" cy="5.5" rx="8" ry="3"/><path d="M4 5.5v13c0 1.7 3.6 3 8 3s8-1.3 8-3v-13"/><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
    "imbuto": '<path d="M3 4h18l-7 8.5V19l-4 2v-8.5z"/>',
    "bersaglio": '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/>',
    "blocco": '<circle cx="12" cy="12" r="9"/><path d="m5.6 5.6 12.8 12.8"/>',
    "robot": '<rect x="4.5" y="8" width="15" height="11.5" rx="3"/><path d="M12 4.5V8M2.5 13v2.5M21.5 13v2.5"/><circle cx="12" cy="3.5" r="1"/><circle cx="9.3" cy="13.3" r="1.2" fill="currentColor"/><circle cx="14.7" cy="13.3" r="1.2" fill="currentColor"/>',
    "fulmine": '<path d="M13 2.5 4.5 13.5H11l-1 8 8.5-11H12z"/>',
    "lucchetto": '<rect x="4.5" y="10.5" width="15" height="10.5" rx="2.5"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>',
    "occhio": '<path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    "cartella": '<path d="M3 6.5A1.5 1.5 0 0 1 4.5 5h4.3l2 2.5h8.7A1.5 1.5 0 0 1 21 9v9.5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5z"/>',
    "freccia": '<path d="M4 12h16M14 6l6 6-6 6"/>',
    "ciclo": '<path d="M20 11a8 8 0 0 0-14.6-4.3M4 13a8 8 0 0 0 14.6 4.3"/><path d="M5 3v4h4M19 21v-4h-4"/>',
    "stella": '<path d="m12 3 2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.8l-5.4 2.9 1.1-6.1-4.5-4.2 6.1-.8z"/>',
    "mano": '<path d="M7 11V5.5a1.5 1.5 0 0 1 3 0V10m0-5.5V4a1.5 1.5 0 0 1 3 0v6m0-4.5a1.5 1.5 0 0 1 3 0V11m0-3a1.5 1.5 0 0 1 3 0v6.5A6.5 6.5 0 0 1 12.5 21H12a6 6 0 0 1-4.7-2.3L4 14.5a1.6 1.6 0 0 1 2.4-2.1L7 13"/>',
    "casa": '<path d="M3.5 11 12 4l8.5 7"/><path d="M5.5 9.5V20h13V9.5"/>',
    "valigia": '<rect x="3" y="7" width="18" height="13" rx="2.5"/><path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M3 12.5h18"/>',
}

TOOLS = {"notion", "slack", "gmail", "n8n", "claude"}


def icon_svg(name, size=28, color="#171717", stroke=2):
    body = ICONS.get(name, ICONS["domanda"])
    return (f'<svg width="{size}" height="{size}" viewBox="0 0 24 24" fill="none" stroke="{color}" '
            f'stroke-width="{stroke}" stroke-linecap="round" stroke-linejoin="round" style="color:{color};display:block">{body}</svg>')
