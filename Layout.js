class Layout {
  constructor(graph) {
    this.graph_ = graph;

    this.nodes_ = [];
    this.nodesByPos_ = new StringMap();
    this.nodesByGraphNode_ = new Map();
    this.linksByPos_ = new StringMap();
    this.labelsByPos_ = new StringMap();
    this.links_ = [];

    this.setInitialPositions();
    this.resolveGroups();
    this.resolveLinks();
    this.resolveAffinity();
    while (this.iterate());
    this.addGroupPos();
    this.drawLinks();
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
      let x = r * SPACING;
      let yRankOffset = 0 - ((nodes.length / 2) * SPACING);
      for (let n = 0; n < nodes.length; ++n) {
        let node = nodes[n];
        let ySubgraphOffset = (node.subgraph * SPACING * maxRankNodes);
        let pos = [x, (n * SPACING) + yRankOffset + ySubgraphOffset];
        let layoutNode = new LayoutNode(node, this.nodesByPos_, pos);
        this.nodes_.push(layoutNode);
        this.nodesByGraphNode_.set(node, layoutNode);
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
      this.groups_.push(new LayoutGroup(group, this.nodesByPos_, nodes));
    }
    for (let subgraph of this.graph_.nodesBySubgraph.values()) {
      let nodes = this.nodesFromGraphNodes(subgraph);
      this.groups_.push(new LayoutGroup(null, this.nodesByPos_, nodes));
    }
    for (let labelGroup of this.graph_.nodesByLabel.values()) {
      let nodes = this.nodesFromGraphNodes(labelGroup);
      this.groups_.push(new LayoutGroup(null, this.nodesByPos_, nodes));
    }
  }

  resolveLinks() {
    for (let node of this.nodes_) {
      node.resolveLinks(this.nodesByGraphNode_);
    }
  }

  resolveAffinity() {
    for (let node of this.nodes_) {
      node.resolveAffinity(this.nodesByGraphNode_);
    }
  }

  iterate() {
    let objects = Array.from(this.nodes_);
    this.setTension(objects);
    this.sortByMostTension(objects);
    for (let group of this.groups_) {
      // Groups go in the list after nodes, and nodes must have tension set
      // properly first.
      group.setTension();
      objects.push(group);
    }

    let baseTension = this.getTotalTension(objects);
    for (let obj of objects) {
      let offsets = new StringMap();
      let addOffset = (x, y) => {
        if (x == 0 && y == 0) {
          return;
        }
        offsets.set([x, y], [x, y]);
      };

      // Map remembers insertion order. We do a relatively exhaustive offset
      // search, but we short circuit, so try the most likely offset first.
      addOffset(Math.sign(obj.vec[0]), Math.sign(obj.vec[1]));
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
        this.setTension(objects);
        let testTension = this.getTotalTension(objects);
        obj.restorePos();
        if (testTension < baseTension) {
          obj.moveBy(offset);
          return true;
        }
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
    let min = [Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY];
    let max = [Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY];
    for (let group of this.groups_) {
      let [groupMin, groupMax] = group.getMinMax();
      for (let i of [0, 1]) {
        min[i] = Math.min(min[i], groupMin[i]);
        max[i] = Math.max(max[i], groupMax[i]);
      }
    }
    for (let link of this.links_) {
      for (let hop of link.path) {
        for (let i of [0, 1]) {
          min[i] = Math.min(min[i], hop[i]);
          max[i] = Math.max(max[i], hop[i]);
        }
      }
    }

    // handle empty graph
    if (min[0] == Number.POSITIVE_INFINITY) {
      min[0] = min[1] = max[0] = max[1] = 0;
    }

    if (this.graph_.label) {
      min[1] -= 1;
    }

    // Set a minimum size and center the smaller graph
    const MIN_SIZE = 7;
    for (let i of [0, 1]) {
      let expand = MIN_SIZE - (max[i] - min[i] + 1);
      if (expand <= 0) {
        continue;
      }
      let expandHalf = Math.floor(expand / 2);
      min[i] -= expandHalf;
      max[i] += (expand - expandHalf);
    }

    // Offset is negative minimum, e.g min -1 means +1 to all values
    for (let node of this.nodes_) {
      for (let i of [0, 1]) {
        node.pos[i] -= min[i];
      }
    }
    for (let link of this.links_) {
      for (let hop of link.path) {
        for (let i of [0, 1]) {
          hop[i] -= min[i];
        }
      }
    }
    this.size = [
        max[0] - min[0] + 1,
        max[1] - min[1] + 1,
    ];
  }

  addGroupPos() {
    for (let group of this.groups_) {
      if (!group.hasGraphGroup()) {
        continue;
      }
      let [min, max] = group.getMinMax();
      for (let x = min[0]; x <= max[0]; ++x) {
        for (let y = min[1]; y <= max[1]; ++y) {
          getOrSet(this.nodesByPos_, [x, y], group);
        }
      }
    }
  }

  drawLinks() {
    let links = [];
    for (let from of this.nodes_) {
      for (let link of from.links) {
        links.push({
          from: from,
          to: link.to,
          label: link.label,
        });
      }
    }

    // Shortest links first
    links.sort((a, b) => (
            this.distance(a.from.pos, a.to.pos) -
            this.distance(b.from.pos, b.to.pos)));

    for (let link of links) {
      this.links_.push(
          new LayoutLink(link.from, link.to, link.label,
                         this.nodesByPos_, this.linksByPos_,
                         this.labelsByPos_));
    }

    for (let link of this.links_) {
      link.drawLabel();
    }
  }

  distance(a, b) {
    let vec = [
        b[0] - a[0],
        b[1] - a[1],
    ];
    return Math.sqrt((vec[0] * vec[0]) + (vec[1] * vec[1]));
  }

  getDrawSteps() {
    let steps = [
      {
        type: 'size',
        size: this.size,
      },
    ];

    if (this.graph_.label) {
      steps.push({
        type: 'graphLabel',
        min: [0, 0],
        max: [this.size[0] - 1, 0],
        label: this.graph_.label,
      });
    }

    let nodes = Array.from(this.nodes_);
    for (let i of [1, 0]) {
      nodes.sort((a, b) => a.pos[i] - b.pos[i]);
    }
    for (let node of nodes) {
      steps.push(node.getStep());
    }

    for (let group of this.groups_) {
      let step = group.getStep();
      if (step) {
        steps.push(step);
      }
    }

    for (let link of this.links_) {
      steps.push(...link.getSteps());
    }

    return steps;
  }
}

<!--# include file="LayoutGroup.js" -->
<!--# include file="LayoutLink.js" -->
<!--# include file="LayoutNode.js" -->
