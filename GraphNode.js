class GraphNode {
  constructor() {
    this.links = [];
    this.linksIn = [];
    this.groups = new Set();
    this.affinity = [];
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

  // TODO: move this to LayoutNode, item by item
  setAffinity(nodes) {
    const INF = 999999;

    for (let node of nodes) {
    }

    for (let link of this.links) {
      // Stronger affinity for links
      // Prefer to move toward the target instance
      this.addAffinity(link.to, d => d <= 2 ? -INF : d * 11);
      link.to.addAffinity(this, d => d <= 2 ? -INF : d * 9);
    }

    // Affinity for groups
    for (let group of this.groups) {
      for (let node of group.nodes) {
        this.addAffinity(node, d => d * 100);
      }
    }
  }

  addAffinity(node, distanceToWeight) {
    if (this == node) {
      return;
    }
    this.affinity.push({
      node: node,
      distanceToWeight: distanceToWeight,
    });
  }

  static process(item, soft=false) {
    if (item.label == '') {
      return null;
    }
    let node = new GraphNode();
    node.id = item.id;
    node.label = item.label;
    node.soft = soft;
    node.highlight = item.highlight;
    return node;
  }
}
