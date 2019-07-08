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
    for (let to of this.links) {
      to.incPageRank(visited);
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
    for (let to of this.links) {
      to.setSubgraph(subgraph, nodes);
    }
    for (let from of this.linksIn) {
      from.setSubgraph(subgraph, nodes);
    }
    for (let group of this.groups) {
      for (let node of group.nodes) {
        node.setSubgraph(subgraph, nodes);
      }
    }
  }

  setAffinity(nodes) {
    const INF = 999999;

    for (let node of nodes) {
      // Weak affinity full mesh
      // Keep unassociated subgroups together
      this.addAffinity(node, d => d);

      // Keep one space between subgraphs
      if (this.subgraph != node.subgraph) {
        this.addAffinity(node, d => d <= 2 ? -INF : 0);
      }

      // Keep one space around groups
      if (this.groups.size && !intersects(this.groups, node.groups)) {
        node.addAffinity(this, d => d <= 2 ? -INF : 0);
      }
    }

    for (let to of this.links) {
      // Stronger affinity for links
      // Prefer to move toward the target instance
      this.addAffinity(to, d => d <= 2 ? -INF : d * 11);
      to.addAffinity(this, d => d <= 2 ? -INF : d * 9);
    }

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
    node.label = item.label;
    node.soft = soft;
    return node;
  }
}
