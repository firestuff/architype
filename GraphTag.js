class GraphTag {
  constructor() {
    this.nodes = [];
  }

  resolve(nodesByLabel) {
    for (let label of this.nodeLabels.values()) {
      for (let node of nodesByLabel.get(label)) {
        this.nodes.push(node);
      }
    }
  }

  static process(item) {
    let tag = new GraphTag();
    tag.id = item.id;
    tag.label = item.label;
    tag.labelId = item.labelObj ? item.labelObj.id : null;
    tag.nodeLabels = new Set();
    for (let member of item.members) {
      if (member.label == '') {
        continue;
      }
      tag.nodeLabels.add(member.label);
    }
    if (tag.nodeLabels.size == 0) {
      return null;
    }
    return tag;
  }
}
