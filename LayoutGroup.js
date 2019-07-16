class LayoutGroup {
  constructor(graphGroup, nodesByPos, nodes, type) {
    this.graphGroup_ = graphGroup;
    this.nodesByPos_ = nodesByPos;
    this.nodes = new Set(nodes);
    this.type = type;
    this.tension = 0;

    this.label = this.graphGroup_ ? this.graphGroup_.label : null;

    for (let node of nodes) {
      node.groups.add(this);
    }
  }

  setTension() {
    // Groups don't track tension, since we always want to sort last for total
    // tension
    this.vec = [0, 0];
    for (let node of this.nodes) {
      for (let i of [0, 1]) {
        this.vec[i] += node.vec[i];
      }
    }
  }

  offsetCollides(offset) {
    for (let node of this.nodes) {
      let other = node.offsetCollides(offset);
      if (other && !this.nodes.has(other)) {
        return other;
      }
    }
    return null;
  }

  savePos() {
    this.savedVec_ = Array.from(this.vec);
  }

  restorePos() {
    this.vec = this.savedVec_;
    // Fix up nodesByPos, as intra-group collisions may have corrupted it
    for (let node of this.nodes) {
      this.nodesByPos_.set(node.pos, node);
    }
  }

  moveBy(offset) {
    for (let node of this.nodes) {
      node.moveBy(offset);
    }
    // Fix up nodesByPos, as intra-group collisions may have corrupted it
    for (let node of this.nodes) {
      this.nodesByPos_.set(node.pos, node);
    }
  }

  getMinMax() {
    let min = [Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER];
    let max = [Number.MIN_SAFE_INTEGER, Number.MIN_SAFE_INTEGER];
    for (let node of this.nodes) {
      for (let i of [0, 1]) {
        min[i] = Math.min(min[i], node.pos[i]);
        max[i] = Math.max(max[i], node.pos[i]);
      }
    }
    if (this.graphGroup_ && this.graphGroup_.label) {
      // Room for the label
      --min[1];
    }
    return [min, max];
  }

  // border is [left, right, top, bottom]
  isContained(pos, border=[0,0,0,0]) {
    let [min, max] = this.getMinMax();
    return (pos[0] >= (min[0] - border[0]) && pos[0] <= (max[0] + border[1]) &&
            pos[1] >= (min[1] - border[2]) && pos[1] <= (max[1] + border[3]));
  }

  isContainedWithMargin(pos) {
    return this.isContained(pos, [1, 1, this.label ? 2 : 1, 1]);
  }

  getSteps() {
    if (!this.graphGroup_) {
      return [];
    }

    let [min, max] = this.getMinMax();
    let steps = [{
      type: 'group',
      min: min,
      max: max,
      id: this.graphGroup_.id,
    }];

    if (this.label) {
      steps.push({
        type: 'groupLabel',
        min: [min[0], min[1]],
        max: [max[0], min[1]],
        id: this.graphGroup_.labelId,
        label: this.graphGroup_.label,
      });
    }

    return steps;
  }

  isType(type) {
    return this.type == type;
  }
}
