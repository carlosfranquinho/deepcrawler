import urllib.parse

monsters = {
    "ratazana_de_esgoto": ("🐀", "#fbbf24"),
    "morcego_das_cavernas": ("🦇", "#fbbf24"),
    "chacal": ("🐕", "#fbbf24"),
    "gnomo_das_trevas": ("🧝", "#fbbf24"),
    "homunculo": ("👺", "#fbbf24"),
    "raposa": ("🦊", "#fbbf24"),
    "formiga_gigante": ("🐜", "#fbbf24"),
    "bolha_acida": ("🦠", "#fbbf24"),
    "lagarto_das_rochas": ("🦎", "#fbbf24"),
    "luz_amarela": ("✨", "#fbbf24"),
    "lobo_selvagem": ("🐺", "#fbbf24"),
    "goblin": ("👺", "#fbbf24"),
    "serpente": ("🐍", "#fbbf24"),
    "orc": ("👹", "#fbbf24"),
    "perfurador_de_rocha": ("🪨", "#f87171"),
    "geleia_ocre": ("🍮", "#f87171"),
    "besta_chifruda": ("🐃", "#f87171"),
    "urso_coruja": ("🦉", "#f87171"),
    "tigre_dentes_de_sabre": ("🐅", "#f87171"),
    "geleia_azul": ("🧊", "#f87171"),
    "soldado_anao": ("🧔", "#f87171"),
    "duende_ladrao": ("🥷", "#f87171"),
    "mumia_humana": ("🧟", "#f87171"),
    "mimico": ("📦", "#f87171"),
    "gnomo_feiticeiro": ("🧙", "#e2e8f0"),
    "ogre": ("🧌", "#e2e8f0"),
    "inseto_eletrico": ("⚡", "#e2e8f0"),
    "limo_verde": ("🤢", "#e2e8f0"),
    "gigante_das_colinas": ("🏔️", "#e2e8f0"),
    "brutamontes": ("💪", "#22c55e"),
    "troll": ("🧟‍♂️", "#22c55e"),
    "elemental_do_fogo": ("🔥", "#22c55e"),
    "basilisco": ("🐊", "#22c55e"),
    "sombra_veloz": ("👤", "#22c55e"),
    "capitao_de_patrulha": ("💂‍♂️", "#22c55e"),
    "carnical": ("💀", "#22c55e"),
    "vampiro": ("🧛‍♂️", "#e11d48"),
    "necromante": ("🦹‍♂️", "#e11d48"),
    "espectro": ("👻", "#e11d48"),
    "dragao": ("🐉", "#e11d48"),
    "balrog": ("👿", "#e11d48"),
    "medusa": ("🪱", "#ef4444"),
    "feiticeiro_das_trevas": ("🧙‍♂️", "#ef4444"),
    "vlad_o_empalador": ("🧛", "#ef4444"),
    "devorador_de_almas": ("👾", "#ef4444")
}

with open("monsters.css", "w") as f:
    for k, (emoji, color) in monsters.items():
        # Encode emoji in SVG
        # Using <text> element to render emoji
        svg = f"""<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 18 18'><text x='9' y='13' font-size='11' text-anchor='middle'>{emoji}</text></svg>"""
        encoded = urllib.parse.quote(svg)
        f.write(f".tileEnemy-{k} {{\n")
        f.write(f"  background-image: url(\"data:image/svg+xml,{encoded}\");\n")
        f.write(f"  background-size: cover;\n")
        f.write(f"  background-color: {color}1a;\n") # Add slight background color
        f.write("}\n\n")

print("monsters.css generated!")
