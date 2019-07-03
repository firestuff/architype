'use strict';

class Architype {
  constructor(container) {
    this.container_ = container;

    this.container_.classList.add('architype');
    // TODO: make theme selectable
    this.container_.classList.add('dark');

    this.container_.addEventListener('keydown', (e) => { this.onKeyDown(e); });
    addEventListener('resize', (e) => { this.onResize(e); });

    let editorElem = document.createElement('ul');
    this.container_.appendChild(editorElem);
    this.editor_ = new Editor(editorElem);

    this.targets_ = document.createElement('datalist');
    this.targets_.id = 'arch-targets';
    this.container_.appendChild(this.targets_);

    this.lines_ = document.createElement('div');
    this.lines_.innerHTML = `<!--# include file="lines.svg" -->`;
    this.lines_ = this.lines_.firstElementChild;
    this.lines_.classList.add('gridLines');
    this.lines_.classList.add('white');

    this.grid_ = document.createElement('div');
    this.grid_.classList.add('grid');
    this.container_.appendChild(this.grid_);

    this.unserialize(JSON.parse(localStorage.getItem('currentState')));

    this.observer_ = new MutationObserver(e => { this.onChange(e); });
    this.observer_.observe(editorElem, {
      attributes: true,
      attributeFilter: ['data-arch-value'],
      childList: true,
      subtree: true,
    });

    this.onChange();
  }

  serialize() {
    return {
      version: 1,
      editor: this.editor_.serialize(),
    };
  }

  unserialize(ser) {
    if (!ser) {
      return;
    }

    switch (ser.version) {
      case 1:
        this.editor_.unserialize(ser.editor);
        break;

      default:
        console.log('unrecognized localStorage.currentState version', ser);
        break;
    }
  }

  onChange(e) {
    this.graph_ = this.buildGraph();
    localStorage.setItem('currentState', JSON.stringify(this.serialize()));
    this.buildGrid(this.graph_);
    this.updateTargets(this.graph_);
    this.fixSizes(this.graph_.nodes);
  }

  onKeyDown(e) {
    switch (e.key) {
      case 'z':
        this.exportGraphviz();
        break;
    }
  }

  onResize(e) {
    this.fixSizes(this.graph_.nodes);
  }

  exportGraphviz() {
    let lines = [
        'digraph G {',
        '\trankdir = "LR";',
    ];

    for (let type of ['nodes', 'links', 'groups']) {
      for (let obj of this.graph_[type]) {
        for (let line of obj.exportGraphviz()) {
          lines.push('\t' + line);
        }
      }
    }

    lines.push('}');
    navigator.clipboard.writeText(lines.join('\n'));
  }

  updateTargets(graph) {
    // Lots of effort to avoid churning the datalist

    let curTargets = new Map();
    for (let option of this.targets_.options) {
      curTargets.set(option.value, option);
    }

    for (let [label, entries] of graph.nodesByLabel.entries()) {
      if (curTargets.has(label)) {
        continue;
      }
      if (entries.length == 1 &&
          document.activeElement.parentElement.xArchObj &&
          document.activeElement.parentElement.xArchObj == entries[0]) {
        // Skip an element currently being edited
        continue;
      }
      let option = document.createElement('option');
      option.value = label;
      this.targets_.appendChild(option);
    }

    for (let [label, option] of curTargets.entries()) {
      if (graph.nodesByLabel.has(label)) {
        continue;
      }
      option.remove();
    }
  }

  buildGraph() {
    let graph = {
      nodesByLabel: new Map(),
      nodesByPageRank: new Map(),
      nodesByPos: new Map(),
      nodesBySubgraph: new Map(),
      groups: [],
      links: [],
      nodes: [],
    };
    // Order here is important, as each step carefully builds on data
    // constructed by the previous
    this.buildGraphInt(graph, this.editor_.getEntries());
    this.trimSoftNodes(graph);
    this.processLinks(graph);
    this.processGroups(graph);
    this.manifestNodes(graph);
    this.setPageRank(graph);
    this.bucketByPageRank(graph);
    this.bucketBySubgraph(graph);
    this.setInitialPositions(graph);
    this.setAffinity(graph);

    while (this.iterate(graph));
    this.fixOrigin(graph);

    return graph;
  }

  buildGraphInt(graph, entries) {
    for (let entry of entries) {
      if (entry instanceof EditorNode) {
        this.buildGraphNode(graph, entry);
      } else if (entry instanceof EditorGroup) {
        this.buildGraphGroup(graph, entry);
      } else if (entry instanceof EditorLink) {
        this.buildGraphLink(graph, entry);
      }
    }
  }

  buildGraphNode(graph, node) {
    node.clear();
    if (node.getLabel() == '') {
      return;
    }
    let targets = graph.nodesByLabel.get(node.getLabel());
    if (!targets) {
      targets = [];
      graph.nodesByLabel.set(node.getLabel(), targets);
    }
    targets.push(node);
  }

  buildGraphGroup(graph, group) {
    group.clear();
    graph.groups.push(group);
    this.buildGraphInt(graph, group.getNodes());
  }

  buildGraphLink(graph, link) {
    link.clear();
    graph.links.push(link);
    this.buildGraphInt(graph, [link.getFrom(), link.getTo()]);
  }

  trimSoftNodes(graph) {
    for (let entries of graph.nodesByLabel.values()) {
      for (let i = entries.length - 1; i >= 0 && entries.length > 1; --i) {
        if (entries[i] instanceof EditorNode && entries[i].isSoft()) {
          entries.splice(i, 1);
        }
      }
    }
  }

  processLinks(graph) {
    for (let link of graph.links) {
      // Re-resolve each from/to reference by label, so we skip soft nodes and
      // handle multiple objects with the same label
      link.from = graph.nodesByLabel.get(link.getFrom().getLabel()) || [];
      link.to = graph.nodesByLabel.get(link.getTo().getLabel()) || [];
      for (let from of link.from) {
        for (let to of link.to) {
          from.links.push(to);
        }
      }
    }
  }

  processGroups(graph) {
    for (let group of graph.groups) {
      group.nodes = [];
      for (let member of group.getNodes()) {
        let nodes = graph.nodesByLabel.get(member.getLabel()) || [];
        for (let node of nodes) {
          group.nodes.push(node);
          node.groups.push(group);
        }
      }
    }
  }

  manifestNodes(graph) {
    for (let entries of graph.nodesByLabel.values()) {
      for (let entry of entries) {
        if (entry instanceof EditorNode) {
          graph.nodes.push(entry);
        }
      }
    }
  }

  setPageRank(graph) {
    for (let link of graph.links) {
      for (let to of link.to) {
        this.setPageRankInt(to, new Set());
      }
    }
    for (let group of graph.groups) {
      // All members of a group get the rank of the maximum member, so the
      // initial positions will put them all near each other
      let maxRank = 0;
      for (let member of group.nodes) {
        maxRank = Math.max(maxRank, member.pageRank);
      }
      for (let member of group.nodes) {
        member.pageRank = maxRank;
      }
    }
  }

  setPageRankInt(node, visited) {
    if (visited.has(node)) {
      // Loop detection
      return;
    }
    ++node.pageRank;
    visited.add(node);
    for (let out of node.links) {
      this.setPageRankInt(out, visited);
    }
    visited.delete(node);
  }

  bucketByPageRank(graph) {
    for (let node of graph.nodes) {
      let bucket = graph.nodesByPageRank.get(node.pageRank);
      if (!bucket) {
        bucket = [];
        graph.nodesByPageRank.set(node.pageRank, bucket);
      }
      bucket.push(node);
    }
    let cmp = (a, b) => {
      if (a < b) {
        return -1;
      } else if (a > b) {
        return 1;
      } else {
        return 0;
      }
    };
    for (let bucket of graph.nodesByPageRank.values()) {
      bucket.sort(cmp);
    }
  }

  bucketBySubgraph(graph) {
    let nodes = new Set();
    let ranks = Array.from(graph.nodesByPageRank.keys());
    ranks.sort((a, b) => a - b);
    for (let rank of ranks) {
      for (let node of graph.nodesByPageRank.get(rank)) {
        nodes.add(node);
      }
    }
    for (let subgraph = 0; nodes.size; ++subgraph) {
      let node = nodes.values().next().value;
      let subgraphArr = [];
      graph.nodesBySubgraph.set(subgraph, subgraphArr);
      this.recurseSubgraph(subgraph, subgraphArr, node, nodes);
    }
  }

  recurseSubgraph(subgraph, subgraphArr, node, nodes) {
    if (node.subgraph !== null) {
      return;
    }
    node.subgraph = subgraph;
    subgraphArr.push(node);
    nodes.delete(node);
    for (let to of node.links) {
      this.recurseSubgraph(subgraph, subgraphArr, to, nodes);
    }
    for (let group of node.groups) {
      for (let member of group.nodes) {
        this.recurseSubgraph(subgraph, subgraphArr, member, nodes);
      }
    }
  }

  setInitialPositions(graph) {
    const SPACING = 4;

    let maxRankNodes = 0;
    for (let nodes of graph.nodesByPageRank.values()) {
      maxRankNodes = Math.max(maxRankNodes, nodes.length);
    }

    let ranks = Array.from(graph.nodesByPageRank.keys());
    ranks.sort((a, b) => a - b);
    for (let r = 0; r < ranks.length; ++r) {
      let nodes = graph.nodesByPageRank.get(ranks[r]);
      for (let n = 0; n < nodes.length; ++n) {
        let node = nodes[n];
        let pos = [
            r * SPACING,
            Math.floor((nodes.length / 2) * SPACING) + (n * SPACING) +
                (node.subgraph * SPACING * maxRankNodes),
        ];
        node.moveTo(graph, pos);
      }
    }
  }

  fixOrigin(graph) {
    let min = [Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER];
    let max = [Number.MIN_SAFE_INTEGER, Number.MIN_SAFE_INTEGER];
    for (let node of graph.nodes) {
      for (let i of [0, 1]) {
        min[i] = Math.min(min[i], node.pos[i]);
        max[i] = Math.max(max[i], node.pos[i]);
      }
    }
    // Offset is negative minimum, e.g min -1 means +1 to all values
    for (let node of graph.nodes) {
      for (let i of [0, 1]) {
        node.pos[i] -= min[i];
      }
    }
    graph.size = [
        max[0] - min[0] + 1,
        max[1] - min[1] + 1,
    ];
  }

  setAffinity(graph) {
    const INF = 999999;
    for (let node of graph.nodes) {
      for (let other of graph.nodes) {
        // Weak affinity full mesh
        // Keep unassociated subgroups together
        this.addAffinity(node, other, d => d);

        if (node.subgraph != other.subgraph) {
          this.addAffinity(node, other, d => d < 1.5 ? -INF : 0);
        }
      }
      for (let to of node.links) {
        // Stronger affinity for links
        // Prefer to move toward the target instance
        this.addAffinity(node, to, d => d < 1.5 ? -INF : d * 11);
        this.addAffinity(to, node, d => d < 1.5 ? -INF : d * 9);
      }
      for (let group of node.groups) {
        for (let member of group.nodes) {
          // Even stronger affinity for groups
          // Other nodes will reference this one and take care of the full
          // group mesh
          this.addAffinity(node, member, d => d * 100);
        }
        let members = new Set(group.nodes);
        for (let other of graph.nodes) {
          if (members.has(other)) {
            continue;
          }
          // Nodes not in this group run away
          this.addAffinity(other, node, d => d < 1.5 ? -INF : 0);
        }
      }
    }
  }

  addAffinity(node, other, func) {
    if (node == other) {
      return;
    }
    node.affinity.push({
      node: other,
      distanceToWeight: func,
    });
  }

  buildGrid(graph) {
    this.grid_.innerHTML = '';

    this.grid_.style.gridTemplateColumns =
        'repeat(' + graph.size[0] + ',1fr)';
    this.grid_.style.gridTemplateRows =
        'repeat(' + graph.size[1] +
        ',minmax(0, calc((100vw - var(--editor-width)) / ' +
        graph.size[0] + ')))';

    this.drawGridNodes(graph);
  }

  addLines(pos, cls) {
    let lines = this.lines_.cloneNode(true);
    lines.classList.add(cls);
    lines.style.gridColumn = pos[0] + 1;
    lines.style.gridRow = pos[1] + 1;
    this.grid_.appendChild(lines);
    return lines;
  }

  iterate(graph) {
    let nodes = Array.from(graph.nodes);
    this.sortByMostTension(nodes);
    for (let group of graph.groups) {
      nodes.push(group.getCollection());
    }
    for (let subgraph of graph.nodesBySubgraph.values()) {
      nodes.push(new Collection(subgraph));
    }

    let newOffset = null;
    let newTension = this.getTotalTension(nodes);
    for (let node of nodes) {
      let origPos = node.pos;
      let offsets = new Map();
      let addOffset = (x, y) => {
        if (!offsets.has([x, y].toString())) {
          offsets.set([x, y].toString(), [x, y]);
        }
      };
      for (let dir of [-1, 0, 1]) {
        addOffset(Math.sign(node.vec[0]), dir);
        addOffset(dir, Math.sign(node.vec[1]));
      }
      for (let offset of offsets.values()) {
        if (node.offsetCollides(graph, offset)) {
          continue;
        }
        node.savePos();
        node.moveBy(graph, offset);
        let testTension = this.getTotalTension(nodes);
        node.restorePos(graph);
        if (testTension < newTension) {
          newOffset = offset;
          newTension = testTension;
        }
      }
      if (newOffset) {
        node.moveBy(graph, newOffset);
        return true;
      }
    }
    return false;
  }

  getTotalTension(nodes) {
    let total = 0;
    for (let node of nodes) {
      node.setTension();
      total += node.tension;
    }
    return total;
  }

  sortByMostTension(nodes) {
    for (let node of nodes) {
      node.setTension();
    }
    nodes.sort((a, b) => b.tension - a.tension);
  }

  drawGridNodes(graph) {
    for (let node of graph.nodes) {
      node.gridElem = document.createElement('div');
      node.gridElem.classList.add('gridNode');
      this.grid_.appendChild(node.gridElem);
      node.gridElem.innerText = node.getLabel();
      node.gridElem.style.gridColumn = node.pos[0] + 1;
      node.gridElem.style.gridRow = node.pos[1] + 1;
    }
  }

  fixSizes(nodes) {
    for (let node of nodes) {
      let elem = node.gridElem;
      elem.style.fontSize = null;
      for (let size = 20;
           size && (elem.scrollWidth > elem.clientWidth ||
                    elem.scrollHeight > elem.clientHeight);
           --size) {
        elem.style.fontSize = size + 'px';
      }
    }
  }
}

<!--# include file="Collection.js" -->

<!--# include file="Editor.js" -->
<!--# include file="EditorEntryBase.js" -->
<!--# include file="EditorGroup.js" -->
<!--# include file="EditorLink.js" -->
<!--# include file="EditorNode.js" -->

<!--# include file="utils.js" -->

new Architype(document.getElementById('architype'));
