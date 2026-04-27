# Sistema tipográfico — Pulselane

O sistema tipográfico do Pulselane foi definido para equilibrar clareza, densidade de informação e personalidade visual. Como o produto lida com clientes, projetos, tarefas, membros, logs e dados operacionais, a tipografia precisa funcionar bem em interfaces administrativas, tabelas, formulários e páginas de marketing.

## 1. Fonte principal

### Inter

A **Inter** é a fonte principal do produto e deve ser usada em praticamente toda a interface.

Ela foi escolhida por ser altamente legível em telas, funcionar bem em tamanhos pequenos e manter boa leitura em interfaces densas, como listas, tabelas, cards, formulários e telas operacionais.

### Uso recomendado

- Interface do produto
- Navegação
- Tabelas
- Listas de tarefas
- Formulários
- Botões
- Labels
- Menus
- Textos auxiliares
- Estados de erro, loading e vazio

---

## 2. Fonte secundária

### Sora

A **Sora** é a fonte secundária da marca. Seu uso deve ser mais restrito e intencional, principalmente em contextos de branding e comunicação.

Ela adiciona personalidade visual ao Pulselane sem comprometer a seriedade do produto. Por ter construção mais geométrica e moderna, funciona bem em títulos maiores, páginas institucionais e materiais de marketing.

### Uso recomendado

- Landing page
- Hero section
- Títulos institucionais
- Materiais de apresentação
- Peças de marca
- Chamadas principais de marketing

---

## 3. Fonte técnica

### JetBrains Mono

A **JetBrains Mono** deve ser usada para dados técnicos e informações que se beneficiam de espaçamento monoespaçado.

Seu uso ajuda a diferenciar visualmente identificadores, logs e registros técnicos, reforçando a percepção de produto operacional e auditável.

### Uso recomendado

- IDs
- Logs
- Audit logs
- Tokens truncados
- Códigos técnicos
- Referências internas
- Dados de sistema

---

# Hierarquia tipográfica

A escala tipográfica deve ser consistente em todo o produto. Variações devem ser criadas apenas quando houver necessidade real de hierarquia ou contexto visual.

## H1

| Propriedade | Valor |
|---|---:|
| Fonte | Inter ou Sora |
| Tamanho | `32px` |
| Peso | `600` |
| Line-height | `1.2` |

### Uso recomendado

- Títulos principais de página
- Cabeçalhos de áreas importantes
- Hero titles em contexto de marketing

---

## H2

| Propriedade | Valor |
|---|---:|
| Fonte | Inter |
| Tamanho | `24px` |
| Peso | `600` |
| Line-height | `1.3` |

### Uso recomendado

- Seções internas
- Blocos principais dentro de páginas
- Agrupamentos de conteúdo

---

## H3

| Propriedade | Valor |
|---|---:|
| Fonte | Inter |
| Tamanho | `20px` |
| Peso | `500` |
| Line-height | `1.4` |

### Uso recomendado

- Subtítulos
- Títulos de cards
- Agrupadores menores
- Cabeçalhos de listas ou painéis

---

## Body

| Propriedade | Valor |
|---|---:|
| Fonte | Inter |
| Tamanho | `14px` |
| Peso | `400` |
| Line-height | `1.6` |

### Uso recomendado

- Texto principal da interface
- Descrições
- Conteúdo de cards
- Tabelas
- Listas
- Formulários
- Detalhes de clientes, projetos e tarefas

O texto base é um dos pontos mais importantes do produto. Se ele for grande demais, a interface perde densidade. Se for pequeno demais, a leitura fica cansativa. O tamanho de `14px` mantém bom equilíbrio para um SaaS operacional.

---

## Body small

| Propriedade | Valor |
|---|---:|
| Fonte | Inter |
| Tamanho | `12px` |
| Peso | `400` |
| Line-height | `1.5` |

### Uso recomendado

- Metadados
- Timestamps
- Textos auxiliares
- Descrições secundárias
- Labels de apoio
- Informações complementares

---

## Label / UI

| Propriedade | Valor |
|---|---:|
| Fonte | Inter |
| Tamanho | `13px` |
| Peso | `500` |

### Uso recomendado

- Botões
- Inputs
- Selects
- Tabs
- Badges
- Labels de formulário
- Elementos de navegação compactos

Essa escala mantém boa legibilidade sem comprometer a densidade da interface.

---

## Mono

| Propriedade | Valor |
|---|---:|
| Fonte | JetBrains Mono |
| Tamanho | `12px` a `13px` |
| Peso | `400` |

### Uso recomendado

- IDs
- Logs
- Audit logs
- Eventos técnicos
- Referências internas
- Dados estruturados

---

# Diretrizes de uso

A **Inter** deve ser a fonte padrão da aplicação. A **Sora** deve ser reservada para momentos de maior impacto visual, principalmente fora do fluxo operacional do produto. A **JetBrains Mono** deve aparecer apenas quando a informação tiver natureza técnica ou exigir diferenciação visual clara.

Evite misturar fontes dentro do mesmo bloco sem necessidade. A hierarquia deve ser construída principalmente com tamanho, peso, espaçamento e contraste, não com troca excessiva de família tipográfica.

Em telas operacionais, priorize legibilidade e densidade. Em telas de marketing, é aceitável usar mais personalidade visual, desde que a leitura continue clara.

# Resumo técnico

```txt
Primary font:    Inter
Brand font:      Sora
Technical font:  JetBrains Mono

H1:              32px / 600 / line-height 1.2
H2:              24px / 600 / line-height 1.3
H3:              20px / 500 / line-height 1.4

Body:            14px / 400 / line-height 1.6
Body small:      12px / 400 / line-height 1.5
Label/UI:        13px / 500
Mono:            12px–13px / 400
```