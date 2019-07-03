class Layout {
  constructor(graph) {
    this.nodesByPos = new Map();

    this.graph_ = graph;

    this.setInitialPositions();
  }

  setInitialPositions() {
    const SPACING = 4;

    let maxRankNodes = 0;
    for (let nodes of this.graph_.nodesByPageRank.values()) {
      maxRankNodes = Math.max(maxRankNodes, nodes.length);
    }

    let ranks = Array.from(this.graph_.nodesByPageRank.keys());
    ranks.sort((a, b) => a - b);
    for (let r = 0; r < ranks.length; ++r) {
      let nodes = this.graph_.nodesByPageRank.get(ranks[r]);
      for (let n = 0; n < nodes.length; ++n) {
        let node = nodes[n];
        let pos = [
            r * SPACING,
            Math.floor((nodes.length / 2) * SPACING) + (n * SPACING) +
                (node.subgraph * SPACING * maxRankNodes),
        ];
        node.pos = pos;
        this.setNodePos(node, pos);
      }
    }
  }

  setNodePos(node, pos) {
    this.nodesByPos.set(pos.toString(), node);
  }
}
