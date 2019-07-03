class Collection {
  constructor(nodes) {
    this.nodes = nodes;
  }

  setTension() {
    this.vec = [0, 0];
    this.tension = 0;
    for (let node of this.nodes) {
      node.setTension();
      for (let i of [0, 1]) {
        this.vec[i] += node.vec[i];
      };
      this.tension += node.tension;
    }
  }

  offsetCollides(graph, offset) {
    // TODO: make this.nodes always a set
    let nodeSet = new Set(this.nodes);
    for (let node of this.nodes) {
      let other = node.offsetCollides(graph, offset);
      if (other && !nodeSet.has(other)) {
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

  restorePos(graph) {
    for (let node of this.nodes) {
      node.restorePos(graph);
    }
  }

  moveBy(graph, offset) {
    let nodes = new Set(this.nodes);
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
