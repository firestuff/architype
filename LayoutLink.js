class LayoutLink {
  constructor(from, to, nodesByPos) {
    this.from_ = from;
    this.to_ = to;
    this.nodesByPos_ = nodesByPos;
    this.bfs();
  }

  getDirect() {
    let cost = 0;
    let pos = Array.from(this.from_.pos);
    let path = [Array.from(this.from_.pos)];

    while (pos[0] != this.to_.pos[0] || pos[1] != this.to_.pos[1]) {
      cost += 1;
      if (this.nodesByPos_.has(pos)) {
        cost += 5;
      }
      for (let i of [0, 1]) {
        pos[i] += Math.sign(this.to_.pos[i] - pos[i]);
      }
      path.push(Array.from(pos));
    }
    
    return [cost, path];
  }

  bfs() {
    // TODO: give more thought to birdirectional search
    // TODO: give more thought to minheap instead of queue
    // TODO: first hop is free
    // TODO: diagonals cost more
    // TODO: don't intersect other lines at the same angle

    let cheapestCostByPos = new StringMap();

    // shortcuts to save the lookup
    let direct = this.getDirect();
    let cheapestCostToGoal = direct[0];
    this.path = direct[1];

    // BFS work queue
    let queue = [
      {
        path: [Array.from(this.from_.pos)],
        cost: 0,
      },
    ];

    while (queue.length) {
      let next = queue.shift();
      let pos = next.path[next.path.length - 1];

      let prev = cheapestCostByPos.get(pos);
      if (prev && prev <= next.cost) {
        // Reached a previous pos via a higher- or equal-cost path
        continue;
      }
      cheapestCostByPos.set(pos, next);

      if (pos[0] == this.to_.pos[0] && pos[1] == this.to_.pos[1]) {
        // Reached the goal
        cheapestCostToGoal = next.cost;
        this.path = next.path;
        continue;
      }

      //// Calculate cost for next hop
      let newCost = next.cost;

      // Any hop has cost
      newCost += 1;

      if (this.nodesByPos_.has(pos)) {
        // Traversing nodes has higher cost
        newCost += 5;
      }

      if (cheapestCostToGoal && newCost >= cheapestCostToGoal) {
        // Can't possibly find a cheaper route via this path
        continue;
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
            cost: newCost,
            path: newPath,
          });
        }
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
