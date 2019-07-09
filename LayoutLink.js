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
          if (next.source == 2) {
            // path is backward because this half of the path started from the
            // end point. Fix it so the arrows end up in the right places.
            this.path.reverse();
          }
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

    for (let i = 0; i < this.path.length; ++i) {
      let hop = this.path[i];
      let prevHop = this.path[i - 1];
      let nextHop = this.path[i + 1];

      if (prevHop) {
        let links = getOrSet(
            this.linksByPos_,
            [hop, this.getInPoint(prevHop, hop)],
            new Set());
        links.add('f' + this.from_.pos.toString());
        links.add('t' + this.to_.pos.toString());
      }

      if (nextHop) {
        let links = getOrSet(
            this.linksByPos_,
            [hop, this.getOutPoint(hop, nextHop)],
            new Set());
        links.add('f' + this.from_.pos.toString());
        links.add('t' + this.to_.pos.toString());
      }
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
      };

      // Overlapping links have cost, but not if they are from or to the same
      // node we are (which render as merging or splitting lines). Allowing
      // that saves space. We XOR because we want to force apart lines between
      // the same pair, e.g. for redundant or cyclical links.
      for (let point of [this.getInPoint(from, to),
                         this.getOutPoint(from, to)]) {
        // inPoint/outPoint is part of the key because we only count the lines
        // as "overlapping" if they travel together, not if they just cross.
        let links = this.linksByPos_.get([pos, point]);
        if (!links) {
          continue;
        }
        let hasFrom = links.has('f' + this.from_.pos.toString());
        let hasTo = links.has('t' + this.to_.pos.toString());
        if (!(hasFrom || hasTo) || (hasFrom && hasTo)) {
          cost += 2;
        }
      }
    }

    let offset = [
        to[0] - from[0],
        to[1] - from[1],
    ];
    if (offset[0] != 0 && offset[1] != 0) {
      // Diagonal; approximate sqrt(2) from distance formula
      cost += 0.5;
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

    let endInPoint = this.getInPoint(this.path[this.path.length - 2],
                                     this.path[this.path.length - 1])

    steps.push({
      type: 'line',
      pos: Array.from(this.path[this.path.length - 1]),
      cls: 's' + endInPoint,
    });

    steps.push({
      type: 'arrow',
      pos: Array.from(this.path[this.path.length - 1]),
      cls: 'a' + endInPoint,
    });

    return steps;
  }
}
