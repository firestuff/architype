class Layout {
  constructor(graph) {
    this.graph_ = graph;

    this.nodesByPos_ = new Map();
    this.nodesByGraphNode_ = new Map();

    this.setInitialPositions();
    this.resolveAffinity();
    this.resolveGroups();
    while (this.iterate());
    this.fixOrigin();
  }

  setInitialPositions() {
    const SPACING = 4;

    let maxRankNodes = 0;
    for (let nodes of this.graph_.nodesByPageRank.values()) {
      maxRankNodes = Math.max(maxRankNodes, nodes.length);
    }

    let ranks = Array.from(this.graph_.nodesByPageRank.keys());
    ranks.sort((a, b) => a - b);
    for (let r = 0; r < ranks.length; ++r) {
      let nodes = this.graph_.nodesByPageRank.get(ranks[r]);
      for (let n = 0; n < nodes.length; ++n) {
        let node = nodes[n];
        let pos = [
            r * SPACING,
            Math.floor((nodes.length / 2) * SPACING) + (n * SPACING) +
                (node.subgraph * SPACING * maxRankNodes),
        ];
        this.nodesByGraphNode_.set(
            node,
            new LayoutNode(node, this.nodesByPos_, pos));
      }
    }
  }

  nodesFromGraphNodes(graphNodes) {
    let nodes = [];
    for (let graphNode of graphNodes) {
      nodes.push(this.nodesByGraphNode_.get(graphNode));
    }
    return nodes;
  }

  resolveGroups() {
    this.groups_ = [];
    for (let group of this.graph_.groups) {
      let nodes = this.nodesFromGraphNodes(group.nodes);
      this.groups_.push(new LayoutGroup(nodes));
    }
    for (let subgraph of this.graph_.nodesBySubgraph.values()) {
      let nodes = this.nodesFromGraphNodes(subgraph);
      this.groups_.push(new LayoutGroup(nodes));
    }
  }

  resolveAffinity() {
    for (let node of this.nodesByGraphNode_.values()) {
      node.resolveAffinity(this.nodesByGraphNode_);
    }
  }

  iterate() {
    let objects = Array.from(this.nodesByPos_.values());
    objects.push(...this.groups_);
    this.setTension(objects);
    this.sortByMostTension(objects);

    let newOffset = null;
    let newTension = this.getTotalTension(objects);
    for (let obj of objects) {
      let offsets = new Map();
      let addOffset = (x, y) => {
        if (x == 0 && y == 0) {
          return;
        }
        offsets.set([x, y].toString(), [x, y]);
      };
      for (let dir of [-1, 0, 1]) {
        addOffset(Math.sign(obj.vec[0]), dir);
        addOffset(dir, Math.sign(obj.vec[1]));
      }
      for (let offset of offsets.values()) {
        if (obj.offsetCollides(offset)) {
          continue;
        }
        obj.savePos();
        obj.moveBy(offset);
        let testTension = this.getTotalTension(objects);
        obj.restorePos();
        if (testTension < newTension) {
          newOffset = offset;
          newTension = testTension;
        }
      }
      if (newOffset) {
        obj.moveBy(newOffset);
        return true;
      }
    }
    return false;
  }

  setTension(objects) {
    for (let obj of objects) {
      obj.setTension();
    }
  }

  sortByMostTension(objects) {
    objects.sort((a, b) => b.tension - a.tension);
  }

  getTotalTension(objects) {
    let total = 0;
    for (let obj of objects) {
      total += obj.tension;
    }
    return total;
  }

  fixOrigin() {
    let min = [Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER];
    let max = [Number.MIN_SAFE_INTEGER, Number.MIN_SAFE_INTEGER];
    for (let node of this.nodesByPos_.values()) {
      for (let i of [0, 1]) {
        min[i] = Math.min(min[i], node.pos[i]);
        max[i] = Math.max(max[i], node.pos[i]);
      }
    }
    // Offset is negative minimum, e.g min -1 means +1 to all values
    for (let node of this.nodesByPos_.values()) {
      for (let i of [0, 1]) {
        node.pos[i] -= min[i];
      }
    }
    this.size = [
        max[0] - min[0] + 1,
        max[1] - min[1] + 1,
    ];
  }

  getDrawSteps() {
    let steps = [
      {
        type: 'size',
        size: this.size,
      },
    ];

    let nodes = Array.from(this.nodesByPos_.values());
    for (let i of [1, 0]) {
      nodes.sort((a, b) => a.pos[i] - b.pos[i]);
    }
    for (let node of nodes) {
      steps.push({
        type: 'node',
        pos: node.pos,
        label: node.graphNode.label,
      });
    }

    return steps;
  }
}

<!--# include file="LayoutGroup.js" -->
<!--# include file="LayoutNode.js" -->
