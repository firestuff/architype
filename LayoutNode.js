class LayoutNode {
  constructor(graphNode, nodesByPos, pos) {
    this.graphNode_ = graphNode;
    this.nodesByPos_ = nodesByPos;
    this.pos = pos;

    this.groups = new Set();
    this.tags = new Set();
    this.affinity_ = [];

    this.label = this.graphNode_.label;
    this.pageRank = this.graphNode_.pageRank;
    this.subgraph = this.graphNode_.subgraph;

    this.nodesByPos_.set(this.pos, this);
  }

  resolveLinks(nodesByGraphNode) {
    this.links = [];
    for (let link of this.graphNode_.links) {
      this.links.push({
        to: nodesByGraphNode.get(link.to),
        id: link.id,
        label: link.label,
        labelId: link.labelId,
      });
    }
  }

  setAffinity(nodesByGraphNode) {
    const INF = 999999;

    for (let node of nodesByGraphNode.values()) {
      // Weak affinity full mesh
      // Keep unassociated subgroups together
      this.addAffinity(node, d => d);

      // Keep one space between subgraphs
      if (this.subgraph != node.subgraph && this.label != node.label) {
        this.addAffinity(node, d => d <= 2 ? -INF : 0);
      }

      // Am I in any labeled groups that node is not?
      // If so, preserve two spaces above the group
      if (asymDifference(this.labelGroups(this.groups), node.groups).size) {
        this.addAffinity(node,
          (d, v) =>
          (v[0] >= -1 && v[0] <= 1 && v[1] < 0 && v[1] >= -2) ? -INF : 0);
      }

      // Preserve one space all around the group
      if (asymDifference(this.graphGroups(this.groups),
                         this.graphGroups(node.groups)).size) {
        this.addAffinity(node, d => d <= 2 ? -INF : 0);
      }

      // Try to stack nodes with the same label
      if (node.label == this.label) {
        this.addAffinity(node, (d, v) => v[0] == 0 ? 200 : 500);
      }

      for (let group of this.groups) {
        // Ensure groups do not overlap
        if (group.nodes.has(node)) {
          continue;
        }
        this.addAffinity(node, (d, v, p) => group.isContained(p) ? -INF : 0);
      }
    }

    for (let link of this.links) {
      // Stronger affinity for links
      // Prefer to move toward the target instance
      this.addAffinity(link.to, d => d <= 2 ? -INF : d * 11);
      link.to.addAffinity(this, d => d <= 2 ? -INF : d * 9);
    }

    // Affinity for groups
    for (let group of this.groups) {
      if (!group.hasGraphGroup()) {
        continue;
      }
      for (let node of group.nodes) {
        this.addAffinity(node, d => d * 100);
      }
    }
  }

  graphGroups(groups) {
    return new Set(Array.from(groups).filter(g => g.hasGraphGroup()));
  }

  labelGroups(groups) {
    return new Set(Array.from(groups).filter(g => !!g.label));
  }

  addAffinity(node, distanceToWeight) {
    if (this == node) {
      return;
    }
    this.affinity_.push({
      node: node,
      distanceToWeight: distanceToWeight,
    });
  }

  setTension() {
    this.vec = [0, 0];
    this.tension = 0;
    for (let aff of this.affinity_) {
      let vec = [], vecsum = 0;
      for (let i of [0, 1]) {
        vec[i] = aff.node.pos[i] - this.pos[i];
        vecsum += Math.abs(vec[i]);
      }
      // Avoid calling sqrt(), since the results are used relatively
      let distanceSquared = vec[0] * vec[0] + vec[1] * vec[1];
      let weight = aff.distanceToWeight(distanceSquared, vec, aff.node.pos);
      if (weight instanceof Array) {
        for (let i of [0, 1]) {
          this.vec[i] += weight[i];
          this.tension += Math.abs(weight[i]);
        }
      } else {
        for (let i of [0, 1]) {
          this.vec[i] += (weight * vec[i]) / vecsum;
        }
        this.tension += Math.abs(weight);
      }
    }
  }

  offsetToPos(offset) {
    return [
        this.pos[0] + offset[0],
        this.pos[1] + offset[1],
    ];
  }

  offsetCollides(offset) {
    let newPos = this.offsetToPos(offset);
    return this.nodesByPos_.get(newPos);
  }

  moveTo(pos) {
    this.nodesByPos_.delete(this.pos);
    this.pos = pos;
    this.nodesByPos_.set(this.pos, this);
  }

  moveBy(offset) {
    this.moveTo(this.offsetToPos(offset));
  }

  savePos() {
    this.savedPos_ = this.pos;
  }

  restorePos() {
    this.moveTo(this.savedPos_);
  }

  getStep() {
    return {
      type: 'node',
      pos: this.pos,
      id: this.graphNode_.id,
      label: this.graphNode_.label,
      tags: Array.from(this.tags),
    };
  }
}
