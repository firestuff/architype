class LayoutTag {
  constructor(graphTag, nodes, idx) {
    this.graphTag_ = graphTag;
    this.nodes_ = new Set(nodes);
    this.idx_ = idx;

    this.label = this.graphTag_ ? this.graphTag_.label : null;

    const NUM_TAGS = 6;

    for (let node of this.nodes_) {
      node.tags.add(this.idx_ % NUM_TAGS);
    }
  }

  getSteps() {
    let steps = [];
    return steps;
  }
}
