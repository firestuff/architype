class LayoutLink {
  constructor(from, to, nodesByPos, linksByPos) {
    this.from_ = from;
    this.to_ = to;
    this.nodesByPos_ = nodesByPos;
    this.linksByPos_ = linksByPos;
    this.bfs();
  }

  bfs() {
    // TODO: make diagonals cost more

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

      //// Calculate cost for next hop
      let newCost = next.cost;

      // Any hop has cost
      newCost += 1;

      // Overlapping links have cost
      if (this.linksByPos_.has(pos)) {
        newCost += 2;
      }

      if (this.nodesByPos_.has(pos)) {
        // Traversing nodes has higher cost
        newCost += 5;
      }

      for (let xOff of [-1, 0, 1]) {
        for (let yOff of [-1, 0, 1]) {
          if (xOff == 0 && yOff == 0) {
            continue;
          }
          let newPos = [pos[0] + xOff, pos[1] + yOff];
          let newPath = Array.from(next.path);
          newPath.push(newPos);
          queue.push({
            path: newPath,
            cost: newCost,
            source: next.source,
          });
        }
      }
    }

    for (let hop of this.path) {
      getOrSet(this.linksByPos_, hop, []).push(this);
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
