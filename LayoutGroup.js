class LayoutGroup {
  constructor(nodes) {
    this.nodes = new Set(nodes);
    this.tension = 0;
  }

  setTension() {
    // Groups don't track tension, since we always want to sort last for total
    // tension
    this.vec = [0, 0];
    for (let node of this.nodes.values()) {
      node.setTension();
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
}
