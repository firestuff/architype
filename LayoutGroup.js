class LayoutGroup {
  constructor(graphGroup, nodesByPos, nodes) {
    this.graphGroup_ = graphGroup;
    this.nodesByPos_ = nodesByPos;
    this.nodes = new Set(nodes);
    this.tension = 0;
  }

  setTension() {
    // Groups don't track tension, since we always want to sort last for total
    // tension
    this.vec = [0, 0];
    for (let node of this.nodes) {
      for (let i of [0, 1]) {
        this.vec[i] += node.vec[i];
      };
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
    for (let node of this.nodes) {
      node.savePos();
    }
  }

  restorePos() {
    for (let node of this.nodes) {
      node.restorePos();
    }
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

  getStep() {
    if (!this.graphGroup_) {
      return null;
    }

    let [min, max] = this.getMinMax();
    return {
      type: 'group',
      min: min,
      max: max,
      label: this.graphGroup_.label,
    };
  }
}
