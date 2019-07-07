class LayoutLink {
  constructor(from, to, nodesByPos, linksByPos) {
    this.from_ = from;
    this.to_ = to;
    this.nodesByPos_ = nodesByPos;
    this.linksByPos_ = linksByPos;
    this.bfs();
  }

  bfs() {
    let bestByPos = new StringMap();

    // shortcut to save the lookup
    let cheapestCostToGoal = null;

    // BFS work queue
    let queue = new MinHeap((a) => a.cost);
    queue.push(...[
      {
        path: [Array.from(this.from_.pos)],
        cost: 0,
        source: 1,
      },
      {
        path: [Array.from(this.to_.pos)],
        cost: 0,
        source: 2,
      },
    ]);

    for (let next = queue.pop(); next; next = queue.pop()) {
      let pos = next.path[next.path.length - 1];

      let best = bestByPos.get(pos);
      if (best) {
        if (best.source != next.source) {
          // Goal reached; encountered a path from the other source
          best.path.reverse();
          next.path.splice(next.path.length - 1, 1);
          this.path = next.path.concat(best.path);
          break;
        }

        if (best.cost <= next.cost) {
          // Reached a previous pos via a higher- or equal-cost path
          continue;
        }
      }
      bestByPos.set(pos, next);

      for (let xOff of [-1, 0, 1]) {
        for (let yOff of [-1, 0, 1]) {
          if (xOff == 0 && yOff == 0) {
            continue;
          }
          let newPos = [pos[0] + xOff, pos[1] + yOff];
          let path = Array.from(next.path);
          path.push(newPos);
          queue.push({
            path: path,
            cost: next.cost + this.getCost(pos, newPos),
            source: next.source,
          });
        }
      }
    }

    for (let hop of this.path) {
      getOrSet(this.linksByPos_, hop, new Set()).add(this);
    }
  }

  // Mapping to lines.svg clock-style numbering
  outPointLookup = new StringMap([
    [[ 0,-1], 0],
    [[ 1,-1], 1],
    [[ 1, 0], 2],
    [[ 1, 1], 3],
    [[ 0, 1], 4],
    [[-1, 1], 5],
    [[-1, 0], 6],
    [[-1,-1], 7],
  ]);

  getCost(from, to) {
    // Only handles adjacent positions

    let cost = 1;

    // Because we're doing bidirectional search, this function must always be
    // symmetric, i.e. returning the same value regardless of order of
    // arguments. That means that any costs applied to nodes must be applied
    // whether the node is from or to. Traversal is double-charged.
    for (let pos of [from, to]) {
      if (this.nodesByPos_.has(pos)) {
        // Traversing nodes has higher cost
        cost += 5;
      } else if (this.linksByPos_.has(pos)) {
        // Overlapping links have cost
        cost += 2 * this.linksByPos_.get(pos).size;
      }
    }

    let offset = [
        to[0] - from[0],
        to[1] - from[1],
    ];
    if (offset[0] != 0 && offset[1] != 0) {
      // Diagonal; approximate sqrt(2) from distance formula
      cost += 0.5;

      // The two other positions in a quad covering this diagonal
      let others = [
          [from[0] + Math.sign(offset[0]), from[1]],
          [from[0], from[1] + Math.sign(offset[1])],
      ];
      if (intersects(
              this.linksByPos_.get(others[0]) || new Set(),
              this.linksByPos_.get(others[1]) || new Set())) {
        // We cross another link at a right angle
        cost += 2;
      }
    }

    return cost;
  }

  getOutPoint(from, to) {
    let offset = [
        to[0] - from[0],
        to[1] - from[1],
    ];
    return this.outPointLookup.get(offset);
  }

  getInPoint(from, to) {
    return (this.getOutPoint(from, to) + 4) % 8;
  }

  getSteps() {
    let steps = [];

    steps.push({
      type: 'line',
      pos: Array.from(this.path[0]),
      cls: 's' + this.getOutPoint(this.path[0], this.path[1]),
    });

    for (let i = 1; i < this.path.length - 1; ++i) {
      let inPoint = this.getInPoint(this.path[i - 1], this.path[i]);
      let outPoint = this.getOutPoint(this.path[i], this.path[i + 1]);
      steps.push({
        type: 'line',
        pos: Array.from(this.path[i]),
        cls: `i${inPoint}o${outPoint}`,
      });
    }

    steps.push({
      type: 'line',
      pos: Array.from(this.path[this.path.length - 1]),
      cls: 's' + this.getInPoint(
          this.path[this.path.length - 2], this.path[this.path.length - 1]),
    });

    return steps;
  }
}
