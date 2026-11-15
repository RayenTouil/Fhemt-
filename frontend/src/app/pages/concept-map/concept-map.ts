import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ApiService, errorMessage } from '../../core/api';
import { ConceptMastery } from '../../core/models';
import { colorOf } from '../../core/levels';
import { UiModeService } from '../../core/ui-mode';

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

interface Node extends ConceptMastery {
  x: number;
  y: number;
  color: string;
}
interface Edge {
  from: Node;
  to: Node;
}

@Component({
  selector: 'app-concept-map',
  imports: [RouterLink],
  templateUrl: './concept-map.html',
})
export class ConceptMap implements OnInit {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  readonly ui = inject(UiModeService);

  readonly concepts = signal<ConceptMastery[] | null>(null);
  readonly error = signal('');
  readonly selected = signal<Node | null>(null);

  readonly nodes = computed<Node[]>(() =>
    (this.concepts() ?? []).map((c) => ({
      ...c,
      ...(POSITIONS[c.id] ?? { x: 320, y: 215 }),
      color: colorOf(c.level),
    })),
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

  ngOnInit() {
    this.api.mastery().subscribe({
      next: (data) => this.concepts.set(data.concepts),
      error: (err) => this.error.set(errorMessage(err)),
    });
  }

  select(node: Node) {
    this.selected.set(this.selected()?.id === node.id ? null : node);
  }

  practise(node: Node) {
    this.router.navigate(['/quiz', node.id]);
  }

  // Les titres des prérequis d'un concept (au lieu de leurs identifiants techniques).
  prerequisiteTitles(node: Node): string {
    const byId = new Map(this.nodes().map((n) => [n.id, n.title]));
    return node.prerequisites.map((id) => byId.get(id) ?? id).join(', ');
  }

  // Version fiche : un cercle tracé à la main (au stylo rouge) autour du concept sélectionné.
  penCircle(n: Node): string {
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
