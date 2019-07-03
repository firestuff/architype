class LayoutNode {
  constructor(graphNode, nodesByPos, pos) {
    this.graphNode_ = graphNode;
    this.nodesByPos_ = nodesByPos;
    this.pos = pos;

    this.nodesByPos_.set(this.pos.toString(), this);
  }

  resolveAffinity(nodesByGraphNode) {
    this.affinity_ = [];
    for (let aff of this.graphNode_.affinity) {
      this.affinity_.push({
        node: nodesByGraphNode.get(aff.node),
        distanceToWeight: aff.distanceToWeight,
      });
    }
  }

  setTension() {
    this.vec = [0, 0];
    this.tension = 0;
    for (let aff of this.affinity_) {
      let vec = [], vecsum = 0;
      for (let i of [0, 1]) {
        vec[i] = aff.node.pos[i] - this.pos[i];
        vecsum += Math.abs(vec[i]);
      };
      let distance = Math.sqrt(Math.pow(vec[0], 2) + Math.pow(vec[1], 2));
      let weight = aff.distanceToWeight(distance);
      for (let i of [0, 1]) {
        this.vec[i] += (weight * vec[i]) / vecsum;
      }
      this.tension += Math.abs(weight);
    }
  }

  offsetToPos(offset) {
    return [
        this.pos[0] + offset[0],
        this.pos[1] + offset[1],
    ];
  }

  offsetCollides(offset) {
    let newPos = this.offsetToPos(offset);
    return this.nodesByPos_.get(newPos.toString());
  }

  moveTo(pos) {
    this.nodesByPos_.delete(this.pos.toString());
    this.pos = pos;
    this.nodesByPos_.set(this.pos.toString(), this);
  }

  moveBy(offset) {
    this.moveTo(this.offsetToPos(offset));
  }

  savePos() {
    this.savedPos_ = this.pos;
  }

  restorePos() {
    this.moveTo(this.savedPos_);
  }
}
