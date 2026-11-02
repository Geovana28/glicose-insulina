# 🩺 Simulador Glicose-Insulina (Bergman)

Simulador do Modelo Mínimo de Bergman para dinâmica glicose-insulina pós-refeição com fenótipos metabólicos e fenotipagem diabética.

## 🚀 Funcionalidades

- **5 Fenótipos Metabólicos** — Saudável, Pré-Diabético, DM Tipo 2, DM Tipo 1 (sem insulina), Atleta
- **Desafio de Refeição (OGTT)** — Carboidratos ajustáveis (0-150g)
- **Curva de Glicose G(t)** — Com faixas normal, pré-diabética e diabética
- **Curva de Insulina I(t)** — Resposta pancreática ao estímulo glicêmico
- **KPIs Clínicos** — Pico glicêmico, G120 (2h pós-prandial), pico de insulina, índice de disposição
- **Parâmetros Ajustáveis** — Si (sensibilidade), γ (resposta beta-cell), p₁ (efetividade), Gb (basal)

## 🧮 Equações Diferenciais (3 Compartimentos)

```
dG/dt = −p₁(G − Gb) − X·G + D(t)     (Glicose)
dX/dt = −p₂·X + p₃(I − Ib)            (Insulina remota)
dI/dt = −n·I + γ·max(G − Gh, 0)·t      (Insulina plasmática)
```

## 🛠️ Tecnologias

- JavaScript Vanilla (ES6+)
- Chart.js
- CSS3 com design premium
- Google Fonts (Inter, JetBrains Mono)

## 📦 Como Executar

Abra `index.html` no navegador — Chart.js carregado via CDN.

## 📁 Estrutura

```
glicose-insulina/
├── index.html    # Layout e controles
├── script.js     # Motor do modelo de Bergman
└── style.css     # Design premium dark theme
```

## ⚠️ Hipóteses do Modelo, Unidades e Limitações

1. **Unidades Fisiológicas**: Glicose plasmática $G(t)$ em $\text{mg/dL}$, insulina plasmática $I(t)$ em $\mu\text{U/mL}$, ação remota da insulina $X(t)$ em $\text{min}^{-1}$ e tempo $t$ em minutos.
2. **Aproximação de Três Compartimentos**: O Modelo Mínimo de Bergman captura a sensibilidade à insulina ($S_I = p_3/p_2$) e a efetividade da glicose ($S_G = p_1$), mas simplifica a dinâmica incretínica intestinal (GLP-1/GIP) e a contrarregulação pelo glucagon.
3. **Finalidade Acadêmica**: Simulador biomédico voltado à exploração de sistemas dinâmicos fisiológicos; não substitui testes diagnósticos laboratoriais (TOTG/HbA1c).

---

Desenvolvido por **Geovana** | Distribuído sob Licença MIT (`LICENSE`) | [Portfólio](../portfolio/index.html)
