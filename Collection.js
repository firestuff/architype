class Collection {
  constructor(nodes) {
    this.nodes = new Set(nodes);
  }

  setTension() {
    this.vec = [0, 0];
    this.tension = 0;
    for (let node of this.nodes.values()) {
      node.setTension();
      for (let i of [0, 1]) {
        this.vec[i] += node.vec[i];
      };
      this.tension += node.tension;
    }
  }

  offsetCollides(graph, offset) {
    for (let node of this.nodes.values()) {
      let other = node.offsetCollides(graph, offset);
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

  restorePos(graph) {
    for (let node of this.nodes.values()) {
      node.restorePos(graph);
    }
  }

  moveBy(graph, offset) {
    let nodes = new Set(this.nodes.values());
    while (nodes.size) {
      for (let node of nodes) {
        if (node.offsetCollides(graph, offset)) {
          continue;
        }
        node.moveBy(graph, offset);
        nodes.delete(node);
      }
    }
  }
}
