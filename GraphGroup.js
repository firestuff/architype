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
    group.id = item.id;
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
