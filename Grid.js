class Grid {
  constructor(container) {
    this.container_ = container;
    this.container_.classList.add('grid');

    this.toSize_ = [];
    addEventListener('resize', (e) => { this.onResize(e); });
  }

  onResize() {
    this.fixSizes();
  }

  draw(steps) {
    this.container_.innerHTML = '';
    this.toSize_.length = 0;

    for (let step of steps) {
      switch (step.type) {
        case 'size':
          this.drawGrid(step.size);
          break;

        case 'arrow':
          this.drawArrow(step.id, step.pos, step.cls);
          break;

        case 'graphLabel':
          this.drawGraphLabel(step.id, step.min, step.max, step.label);
          break;

        case 'group':
          this.drawGroup(step.id, step.min, step.max, step.label);
          break;

        case 'line':
          this.drawLine(step.id, step.pos, step.cls);
          break;

        case 'linkLabel':
          this.drawLinkLabel(step.id, step.pos, step.label);
          break;

        case 'node':
          this.drawNode(step.id, step.label, step.pos);
          break;
      }
    }

    this.fixSizes();
  }

  drawGrid(size) {
    this.container_.style.gridTemplateColumns =
        'repeat(' + size[0] + ',1fr)';
    this.container_.style.gridTemplateRows =
        'repeat(' + size[1] +
        ',minmax(0, calc((100vw - var(--editor-width)) / ' +
        size[0] + ')))';
  }

  drawArrow(id, pos, cls) {
    let svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.container_.appendChild(svg);
    svg.classList.add('gridArrow');
    svg.classList.add('grid-' + id);
    this.maybeHighlight(svg, id);
    svg.style.gridColumn = pos[0] + 1;
    svg.style.gridRow = pos[1] + 1;

    let use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    svg.appendChild(use);
    use.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', '#' + cls);
  }

  drawGraphLabel(id, min, max, label) {
    let elem = document.createElement('div');
    this.container_.appendChild(elem);
    elem.classList.add('gridGraphLabel');
    elem.classList.add('grid-' + id);
    this.maybeHighlight(elem, id);
    elem.style.gridColumn = (min[0] + 1) + ' / ' + (max[0] + 2);
    elem.style.gridRow = (min[1] + 1) + ' / ' + (max[1] + 2);
    elem.innerText = label;
    this.toSize_.push(elem);
  }

  drawGroup(id, min, max, label) {
    let group = document.createElement('div');
    this.container_.appendChild(group);
    group.classList.add('gridGroup');
    group.classList.add('grid-' + id);
    this.maybeHighlight(group, id);
    group.style.gridColumn = (min[0] + 1) + ' / ' + (max[0] + 2);
    group.style.gridRow = (min[1] + 1) + ' / ' + (max[1] + 2);

    if (label != '') {
      // TODO: split this into its own draw step type
      let labelNode = document.createElement('div');
      this.container_.appendChild(labelNode);
      labelNode.classList.add('gridGroupLabel');
      labelNode.classList.add('grid-' + id);
      this.maybeHighlight(labelNode, id);
      labelNode.innerText = label;
      labelNode.style.gridColumn = (min[0] + 1) + ' / ' + (max[0] + 2);
      labelNode.style.gridRow = min[1] + 1;
      this.toSize_.push(labelNode);
    }
  }

  drawLine(id, pos, cls) {
    let svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.container_.appendChild(svg);
    svg.classList.add('gridLines');
    svg.classList.add('grid-' + id);
    this.maybeHighlight(svg, id);
    svg.style.gridColumn = pos[0] + 1;
    svg.style.gridRow = pos[1] + 1;

    let use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    svg.appendChild(use);
    use.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', '#' + cls);
  }

  drawLinkLabel(id, pos, label) {
    let elem = document.createElement('div');
    this.container_.appendChild(elem);
    elem.classList.add('gridLinkLabel');
    elem.classList.add('grid-' + id);
    this.maybeHighlight(elem, id);
    elem.innerText = label;
    elem.style.gridColumn = pos[0] + 1;
    elem.style.gridRow = pos[1] + 1;
    this.toSize_.push(elem);
  }

  drawNode(id, label, pos) {
    let node = document.createElement('div');
    this.container_.appendChild(node);
    node.classList.add('gridNode');
    node.classList.add('grid-' + id);
    this.maybeHighlight(node, id);
    node.innerText = label;
    node.style.gridColumn = pos[0] + 1;
    node.style.gridRow = pos[1] + 1;
    this.toSize_.push(node);
  }

  maybeHighlight(elem, id) {
    let source = document.getElementById(id);
    if (!source) {
      return;
    }
    elem.classList.toggle('highlight', source.classList.contains('highlight'));

    elem.addEventListener('click', () => {
      let editorElem = document.getElementById(id);
      editorElem.xArchObj.toggleHighlight();
    });
  }

  fixSizes() {
    for (let node of this.toSize_) {
      node.style.fontSize = null;
      for (let size = 30;
           size && (node.scrollWidth > node.clientWidth ||
                    node.scrollHeight > node.clientHeight);
           --size) {
        node.style.fontSize = size + 'px';
      }
    }
  }
}
