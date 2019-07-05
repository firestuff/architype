class Layout {
  constructor(graph) {
    this.graph_ = graph;

    this.nodes_ = [];
    this.nodesByPos_ = new StringMap();
    this.nodesByGraphNode_ = new Map();
    this.lineSteps_ = [];

    this.setInitialPositions();
    this.resolveAffinity();
    this.resolveGroups();
    while (this.iterate());
    this.drawLines();
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
  }

  resolveAffinity() {
    for (let node of this.nodesByGraphNode_.values()) {
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
    let min = [Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER];
    let max = [Number.MIN_SAFE_INTEGER, Number.MIN_SAFE_INTEGER];
    for (let group of this.groups_) {
      let [groupMin, groupMax] = group.getMinMax();
      for (let i of [0, 1]) {
        min[i] = Math.min(min[i], groupMin[i]);
        max[i] = Math.max(max[i], groupMax[i]);
      }
    }
    // Offset is negative minimum, e.g min -1 means +1 to all values
    for (let node of this.nodes_) {
      for (let i of [0, 1]) {
        node.pos[i] -= min[i];
      }
    }
    for (let lineStep of this.lineSteps_) {
      for (let i of [0, 1]) {
        lineStep.pos[i] -= min[i];
      }
    }
    this.size = [
        max[0] - min[0] + 1,
        max[1] - min[1] + 1,
    ];
  }

  drawLines() {
    for (let link of this.graph_.links) {
      for (let from of link.from) {
        for (let to of link.to) {
          this.drawLine(
            this.nodesByGraphNode_.get(from),
            this.nodesByGraphNode_.get(to));
        }
      }
    }
  }

  // Mapping to lines.svg clock-style numbering
  outPointLookup = new StringMap([
    [[ 0,-1], 0],
    [[ 1,-1], 1],
    [[ 1, 0], 2],
    [[ 1, 1], 3],
    [[ 0, 1], 4],
    [[-1, 1], 5],
    [[-1, 0], 6],
    [[-1,-1], 7],
  ]);

  drawLine(from, to) {
    let pos = Array.from(from.pos);
    let inPoint = null;
    while (true) {
      let offset = [];
      for (let i of [0, 1]) {
        offset[i] = Math.sign(to.pos[i] - pos[i]);
      }
      let outPoint = this.outPointLookup.get(offset);
      if (inPoint === null) {
        this.lineSteps_.push({
          type: 'line',
          pos: Array.from(pos),
          cls: 's' + outPoint,
        });
      } else {
        if (offset[0] == 0 && offset[1] == 0) {
          // Reached destination
          this.lineSteps_.push({
            type: 'line',
            pos: Array.from(pos),
            cls: 's' + inPoint,
          });
          break;
        } else {
          this.lineSteps_.push({
            type: 'line',
            pos: Array.from(pos),
            cls: 'i' + inPoint + 'o' + outPoint,
          });
        }
      }
      // Set values for the next loop
      inPoint = (outPoint + 4) % 8;
      for (let i of [0, 1]) {
        pos[i] += offset[i];
      }
    }
  }

  getDrawSteps() {
    let steps = [
      {
        type: 'size',
        size: this.size,
      },
    ];

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
    steps.push(...this.lineSteps_);

    return steps;
  }
}

<!--# include file="LayoutGroup.js" -->
<!--# include file="LayoutNode.js" -->
