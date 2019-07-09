class LayoutNode {
  constructor(graphNode, nodesByPos, pos) {
    this.graphNode_ = graphNode;
    this.nodesByPos_ = nodesByPos;
    this.pos = pos;
    this.groups = [];

    this.nodesByPos_.set(this.pos, this);
  }

  resolveLinks(nodesByGraphNode) {
    this.links = [];
    for (let to of this.graphNode_.links) {
      this.links.push(nodesByGraphNode.get(to));
    }
  }

  resolveAffinity(nodesByGraphNode) {
    const INF = 999999;

    // Transitional: copy GraphNode affinity
    this.affinity_ = [];
    for (let aff of this.graphNode_.affinity) {
      this.affinity_.push({
        node: nodesByGraphNode.get(aff.node),
        distanceToWeight: aff.distanceToWeight,
      });
    }

    for (let node of nodesByGraphNode.values()) {
      for (let group of this.groups) {
        // Ensure groups do not overlap
        if (group.nodes.has(node)) {
          continue;
        }
        this.affinity_.push({
          node: node,
          distanceToWeight: (d, v, p) => group.isContained(p) ? -INF : 0,
        });
      }
    }
  }

  setTension() {
    this.vec = [0, 0];
    this.tension = 0;
    for (let aff of this.affinity_) {
      let vec = [], vecsum = 0;
      for (let i of [0, 1]) {
        vec[i] = aff.node.pos[i] - this.pos[i];
        vecsum += Math.abs(vec[i]);
      };
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
      label: this.graphNode_.label,
    };
  }
}
