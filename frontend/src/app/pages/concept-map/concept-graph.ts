import { Component, ElementRef, computed, inject, input, linkedSignal, output } from '@angular/core';
import { labelOf, levelText } from '../../core/levels';
import { ConceptMastery } from '../../core/models';
import { StatusBadge } from '../../shared/status-badge/status-badge';

// Le graphe de la carte des concepts (SVG), séparé de la page : toute la logique du dessin
// et du clavier est au même endroit, et la page ne garde que le panneau de détail.
//
// Accessibilité au clavier (« roving tabindex », comme dans un menu ou une grille) :
//  - Tab entre dans le graphe sur UN seul concept (les autres ont tabindex="-1") ;
//  - les flèches passent au concept le plus proche dans cette direction ;
//  - Début / Fin vont au premier / dernier concept ; Entrée ou Espace sélectionne.
// Chaque concept annonce son titre, son niveau, son statut et ses prérequis.
// Sur petit écran, une liste de boutons s'ajoute sous le graphe (le dessin y devient minuscule).

// Positions des 8 concepts placées à la main dans le SVG (viewBox 640 x 430).
const POSITIONS: Record<string, { x: number; y: number }> = {
  signals: { x: 320, y: 55 },
  sampling: { x: 190, y: 160 },
  modulation: { x: 450, y: 160 },
  quantization: { x: 90, y: 265 },
  nyquist: { x: 290, y: 265 },
  noise: { x: 450, y: 265 },
  linecodes: { x: 90, y: 370 },
  capacity: { x: 370, y: 370 },
};

export interface GraphNode extends ConceptMastery {
  x: number;
  y: number;
}
interface Edge {
  from: GraphNode;
  to: GraphNode;
}

@Component({
  selector: 'app-concept-graph',
  imports: [StatusBadge],
  templateUrl: './concept-graph.html',
})
export class ConceptGraph {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly concepts = input.required<ConceptMastery[]>();
  readonly selectedId = input<string | null>(null);
  readonly fiche = input(false);
  readonly selectedChange = output<string>();

  // Les nœuds dans l'ordre de lecture (de haut en bas, puis de gauche à droite).
  readonly nodes = computed<GraphNode[]>(() =>
    this.concepts()
      .map((c) => ({ ...c, ...(POSITIONS[c.id] ?? { x: 320, y: 215 }) }))
      .sort((a, b) => a.y - b.y || a.x - b.x),
  );

  // Une flèche de chaque prérequis vers le concept qui en a besoin.
  readonly edges = computed<Edge[]>(() => {
    const byId = new Map(this.nodes().map((n) => [n.id, n]));
    const edges: Edge[] = [];
    for (const node of this.nodes()) {
      for (const preId of node.prerequisites) {
        const from = byId.get(preId);
        if (from) edges.push({ from, to: node });
      }
    }
    return edges;
  });

  // Le seul concept atteignable par Tab : le concept sélectionné, sinon le premier.
  readonly activeId = linkedSignal(() => this.selectedId() ?? this.nodes()[0]?.id ?? null);

  // Ce que lit le lecteur d'écran pour un concept.
  label(n: GraphNode): string {
    const status = n.level === null ? '' : `, ${labelOf(n.status).toLowerCase()}`;
    const titles = new Map(this.nodes().map((x) => [x.id, x.title]));
    const pre = n.prerequisites.length
      ? `À voir avant : ${n.prerequisites.map((id) => titles.get(id) ?? id).join(', ')}.`
      : 'Aucun prérequis.';
    return `${n.title} : ${levelText(n.level)}${status}. ${pre}`;
  }

  select(n: GraphNode) {
    this.activeId.set(n.id);
    this.selectedChange.emit(n.id);
  }

  onKeydown(event: KeyboardEvent, n: GraphNode) {
    const nodes = this.nodes();
    let target: GraphNode | undefined;
    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        this.select(n);
        return;
      case 'ArrowRight':
        target = this.nearest(n, 1, 0);
        break;
      case 'ArrowLeft':
        target = this.nearest(n, -1, 0);
        break;
      case 'ArrowDown':
        target = this.nearest(n, 0, 1);
        break;
      case 'ArrowUp':
        target = this.nearest(n, 0, -1);
        break;
      case 'Home':
        target = nodes[0];
        break;
      case 'End':
        target = nodes[nodes.length - 1];
        break;
      default:
        return; // les autres touches gardent leur comportement normal (Tab…)
    }
    event.preventDefault(); // les flèches ne font pas défiler la page
    if (!target) return;
    this.activeId.set(target.id);
    this.host.nativeElement.querySelector<SVGGElement>(`[data-id="${target.id}"]`)?.focus();
  }

  // Le concept voisin dans une direction (dx, dy) :
  //  - ↑ / ↓ : la rangée juste au-dessus ou en dessous, puis le concept le moins décalé ;
  //  - ← / → : le plus proche sur la même rangée, sinon le plus proche en diagonale.
  private nearest(from: GraphNode, dx: number, dy: number): GraphNode | undefined {
    const candidates = this.nodes()
      .filter((n) => n.id !== from.id)
      .map((n) => ({
        n,
        along: (n.x - from.x) * dx + (n.y - from.y) * dy, // distance dans la direction
        across: Math.abs((n.x - from.x) * dy) + Math.abs((n.y - from.y) * dx), // décalage
      }))
      .filter((c) => c.along > 0);
    if (!candidates.length) return undefined;

    if (dy !== 0) {
      const nextRow = Math.min(...candidates.map((c) => c.along));
      const row = candidates.filter((c) => c.along <= nextRow + 20);
      return row.sort((a, b) => a.across - b.across)[0].n;
    }
    const sameRow = candidates.filter((c) => c.across <= 40);
    const pool = sameRow.length ? sameRow : candidates;
    return pool.sort((a, b) => a.along + 2 * a.across - (b.along + 2 * b.across))[0].n;
  }

  // Version fiche : un cercle tracé à la main (au stylo rouge) autour du concept sélectionné.
  penCircle(n: GraphNode): string {
    const { x, y } = n;
    return (
      `M${x - 30} ${y - 24} C${x - 10} ${y - 46} ${x + 42} ${y - 40} ${x + 42} ${y} ` +
      `C${x + 42} ${y + 36} ${x - 6} ${y + 46} ${x - 36} ${y + 20} ` +
      `C${x - 52} ${y - 2} ${x - 32} ${y - 36} ${x - 2} ${y - 40}`
    );
  }

  // Raccourcit la flèche pour qu'elle s'arrête au bord des cercles (rayon 28).
  shorten(edge: Edge, end: 'from' | 'to') {
    const dx = edge.to.x - edge.from.x;
    const dy = edge.to.y - edge.from.y;
    const len = Math.hypot(dx, dy) || 1;
    const r = 30;
    return end === 'from'
      ? { x: edge.from.x + (dx / len) * r, y: edge.from.y + (dy / len) * r }
      : { x: edge.to.x - (dx / len) * (r + 6), y: edge.to.y - (dy / len) * (r + 6) };
  }
}
