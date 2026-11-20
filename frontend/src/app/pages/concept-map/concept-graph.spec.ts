// Tests de la carte des concepts au clavier (roving tabindex, flèches, Entrée).
import { TestBed } from '@angular/core/testing';
import { ConceptMastery } from '../../core/models';
import { ConceptGraph } from './concept-graph';

const concept = (id: string, prerequisites: string[], level: number | null): ConceptMastery => ({
  id,
  title: id,
  short: id,
  summary: '',
  prerequisites,
  level,
  status: level === null ? 'not-assessed' : level >= 70 ? 'mastered' : 'weak',
});

describe('ConceptGraph', () => {
  function setup() {
    const fixture = TestBed.createComponent(ConceptGraph);
    // Positions réelles : signals en haut, sampling et modulation sur la rangée en dessous.
    fixture.componentRef.setInput('concepts', [
      concept('signals', [], 90),
      concept('sampling', ['signals'], 20),
      concept('modulation', ['signals'], null),
    ]);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const node = (id: string) => el.querySelector(`.node[data-id="${id}"]`) as SVGGElement;
    const press = (id: string, key: string) => {
      node(id).dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
      fixture.detectChanges();
    };
    return { fixture, el, node, press };
  }

  it('un seul concept est atteignable par Tab, et il annonce son niveau et ses prérequis', () => {
    const { el, node } = setup();
    expect(el.querySelectorAll('.node[tabindex="0"]').length).toBe(1);
    expect(node('signals').getAttribute('tabindex')).toBe('0');
    expect(node('sampling').getAttribute('aria-label')).toBe(
      'sampling : 20 %, faible. À voir avant : signals.',
    );
    expect(el.querySelector('svg')?.getAttribute('role')).toBe('group'); // plus de role="img"
  });

  it('les flèches déplacent le concept actif, Entrée le sélectionne', () => {
    const { fixture, node, press } = setup();
    let selected = '';
    fixture.componentInstance.selectedChange.subscribe((id) => (selected = id));

    press('signals', 'ArrowDown');
    expect(fixture.componentInstance.activeId()).toBe('sampling');
    press('sampling', 'ArrowRight');
    expect(fixture.componentInstance.activeId()).toBe('modulation');
    expect(node('modulation').getAttribute('tabindex')).toBe('0');

    press('modulation', 'Enter');
    expect(selected).toBe('modulation');
  });
});
