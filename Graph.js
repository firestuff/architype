class Graph {
  constructor(def) {
    this.nodesByLabel = new Map();
    this.nodesByPageRank = new Map();
    this.nodesBySubgraph = new Map();
    this.groups = [];
    this.links = [];
    this.nodes = [];

    this.processList(def.editor);
    this.removeSoftNodes();
    this.resolveLinks();
    this.resolveGroups();
    this.flattenNodes();
    this.setPageRank();
    this.setSubgraph();
    this.bucketNodes();
    this.setAffinity();
  }

  processList(list, soft=false) {
    for (let item of list) {
      this.processItem(item, soft);
    }
  }

  processItem(item, soft=false) {
    switch (item.type) {
      case 'group':
        this.processGroup(item);
        break;

      case 'link':
        this.processLink(item);
        break;

      case 'node':
        this.processNode(item, soft);
        break;
    }
  }

  processGroup(item) {
    let group = GraphGroup.process(item);
    if (!group) {
      return;
    }
    this.groups.push(group);
    this.processList(item.members, true);
  }

  processLink(item) {
    let link = GraphLink.process(item);
    if (!link) {
      return;
    }
    this.links.push(link);
    this.processItem(item.from, true);
    this.processItem(item.to, true);
  }

  processNode(item, soft=false) {
    let node = GraphNode.process(item, soft);
    if (!node) {
      return;
    }
    getOrSet(this.nodesByLabel, node.label, []).push(node);
  }

  removeSoftNodes() {
    for (let nodes of this.nodesByLabel.values()) {
      for (let i = nodes.length - 1; i >= 0 && nodes.length > 1; --i) {
        if (nodes[i].soft) {
          nodes.splice(i, 1);
        }
      }
    }
  }

  resolveLinks() {
    for (let link of this.links) {
      link.resolve(this.nodesByLabel);
    }
  }

  resolveGroups() {
    for (let group of this.groups) {
      group.resolve(this.nodesByLabel);
    }
  }

  flattenNodes() {
    for (let nodes of this.nodesByLabel.values()) {
      this.nodes.push(...nodes);
    }
  }

  setPageRank() {
    for (let link of this.links) {
      link.setPageRank();
    }
    for (let group of this.groups) {
      group.setPageRank();
    }
  }

  setSubgraph() {
    let nodes = new Set(this.nodes);
    for (let subgraph = 0; nodes.size; ++subgraph) {
      let node = nodes.values().next().value;
      node.setSubgraph(subgraph, nodes);
    }
  }

  bucketNodes() {
    for (let node of this.nodes) {
      getOrSet(this.nodesByPageRank, node.pageRank, []).push(node);
      getOrSet(this.nodesBySubgraph, node.subgraph, []).push(node);
    }
    for (let nodes of this.nodesByPageRank.values()) {
      // Ensure deterministic sort order
      nodes.sort();
    }
  }

  setAffinity() {
    for (let node of this.nodes) {
      node.setAffinity(this.nodes);
    }
  }
}

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
    for (let group of this.groups.values()) {
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
        this.addAffinity(node, d => d < 1.5 ? -INF : 0);
      }

      // Keep one space around groups
      if (this.groups.size && !intersects(this.groups, node.groups)) {
        node.addAffinity(this, d => d < 1.5 ? -INF : 0);
      }
    }
    for (let to of this.links) {
      // Stronger affinity for links
      // Prefer to move toward the target instance
      this.addAffinity(to, d => d < 1.5 ? -INF : d * 11);
      to.addAffinity(this, d => d < 1.5 ? -INF : d * 9);
    }
    for (let group of this.groups.values()) {
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

class GraphGroup {
  constructor() {
    this.nodes = [];
  }

  resolve(nodesByLabel) {
    for (let label of this.nodeLabels.values()) {
      for (let node of nodesByLabel.get(label)) {
        this.nodes.push(node);
        node.groups.add(this);
      }
    }
  }

  setPageRank() {
    // All members of a group get the rank of the maximum member, so the
    // initial positions will put them all near each other
    let maxRank = 0;
    for (let node of this.nodes) {
      maxRank = Math.max(maxRank, node.pageRank);
    }
    for (let node of this.nodes) {
      node.pageRank = maxRank;
    }
  }

  static process(item) {
    let group = new GraphGroup();
    group.label = item.label;
    group.nodeLabels = new Set();
    for (let member of item.members) {
      if (member.label == '') {
        continue;
      }
      group.nodeLabels.add(member.label);
    }
    if (group.nodeLabels.size == 0) {
      return null;
    }
    return group;
  }
}

class GraphLink {
  constructor() {
  }

  resolve(nodesByLabel) {
    this.from = nodesByLabel.get(this.fromLabel);
    this.to = nodesByLabel.get(this.toLabel);
    for (let from of this.from) {
      for (let to of this.to) {
        from.links.push(to);
        to.linksIn.push(from);
      }
    }
  }

  setPageRank() {
    for (let to of this.to) {
      to.incPageRank(new Set());
    }
  }

  static process(item) {
    let link = new GraphLink();
    link.label = item.label;
    link.fromLabel = item.from.label;
    link.toLabel = item.to.label;
    if (link.fromLabel == '' || link.toLabel == '') {
      return null;
    }
    return link;
  }
}

function onmessage(def) {
  new Graph(def);
}
