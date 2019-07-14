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

  getSteps(nextLabelPos) {
    let steps = [];
    if (this.label) {
      steps.push({
        type: 'tagLabel',
        id: this.graphTag_.labelId,
        pos: Array.from(nextLabelPos),
        label: this.label,
        tag: this.idx_,
      });
      nextLabelPos[1] -= 1;
    }
    return steps;
  }
}
