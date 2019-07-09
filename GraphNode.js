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

      // Am I in any labeled groups that node is not?
      // If so, preserve one space above the group
      let labeled = new Set(Array.from(this.groups).filter(g => g.label != ''));
      if (asymDifference(labeled, node.groups).size) {
        node.addAffinity(this, (d, v) =>
                         (v[0] == 0 && v[1] > 0 && v[1] < 2) ? -INF : 0);
      }

      // Try to stack nodes with the same label
      if (node.label == this.label) {
        this.addAffinity(node, (d, v) => v[0] == 0 ? 200 : 500);
      }

      // Try to preserve pagerank left-to-right flow from initial positions
      let rankSign = Math.sign(node.pageRank - this.pageRank);
      if (rankSign != 0) {
        this.addAffinity(node, (d, v) =>
                         [Math.sign(v[0]) == rankSign ? 0 : -1000, 0]);
      }
    }

    for (let to of this.links) {
      // Stronger affinity for links
      // Prefer to move toward the target instance
      this.addAffinity(to, d => d <= 2 ? -INF : d * 11);
      to.addAffinity(this, d => d <= 2 ? -INF : d * 9);
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
    node.label = item.label;
    node.soft = soft;
    return node;
  }
}
