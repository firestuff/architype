class GraphNode {
  constructor() {
    this.links = [];
    this.linksIn = [];
    this.groups = new Set();
    this.pageRank = 0;
    this.subgraph = null;
  }

  incPageRank(visited) {
    if (visited.has(this)) {
      // Loop detection
      return;
    }
    ++this.pageRank;
    visited.add(this);
    for (let link of this.links) {
      link.to.incPageRank(visited);
    }
    visited.delete(this);
  }

  setSubgraph(subgraph, nodes) {
    // Flood fill
    if (this.subgraph !== null) {
      return;
    }
    this.subgraph = subgraph;
    nodes.delete(this);
    for (let link of this.links) {
      link.to.setSubgraph(subgraph, nodes);
    }
    for (let link of this.linksIn) {
      link.from.setSubgraph(subgraph, nodes);
    }
    for (let group of this.groups) {
      for (let node of group.nodes) {
        node.setSubgraph(subgraph, nodes);
      }
    }
  }

  static process(item, soft=false) {
    if (item.label == '') {
      return null;
    }
    let node = new GraphNode();
    node.id = item.id;
    node.label = item.label;
    node.soft = soft;
    return node;
  }
}
