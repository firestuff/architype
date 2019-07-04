class LayoutGroup {
  constructor(graphGroup, nodes) {
    this.graphGroup_ = graphGroup;
    this.nodes = new Set(nodes);
    this.tension = 0;
  }

  setTension() {
    // Groups don't track tension, since we always want to sort last for total
    // tension
    this.vec = [0, 0];
    for (let node of this.nodes.values()) {
      for (let i of [0, 1]) {
        this.vec[i] += node.vec[i];
      };
    }
  }

  offsetCollides(offset) {
    for (let node of this.nodes.values()) {
      let other = node.offsetCollides(offset);
      if (other && !this.nodes.has(other)) {
        return other;
      }
    }
    return null;
  }

  savePos() {
    for (let node of this.nodes.values()) {
      node.savePos();
    }
  }

  restorePos() {
    for (let node of this.nodes.values()) {
      node.restorePos();
    }
  }

  moveBy(offset) {
    let nodes = new Set(this.nodes.values());
    while (nodes.size) {
      for (let node of nodes) {
        if (node.offsetCollides(offset)) {
          continue;
        }
        node.moveBy(offset);
        nodes.delete(node);
      }
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
