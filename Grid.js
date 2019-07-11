class Grid {
  constructor(container) {
    this.container_ = container;
    this.container_.classList.add('grid');

    this.toSize_ = [];
    addEventListener('resize', (e) => { this.onResize(e); });
  }

  onResize(e) {
    this.fixSizes();
  }

  draw(steps) {
    this.container_.innerHTML = '';
    this.toSize_ = [];

    for (let step of steps) {
      switch (step.type) {
        case 'size':
          this.drawGrid(step.size);
          break;

        case 'arrow':
          this.drawArrow(step.pos, step.cls, step.highlight);
          break;

        case 'graphLabel':
          this.drawGraphLabel(step.min, step.max, step.label);
          break;

        case 'group':
          this.drawGroup(step.min, step.max, step.label, step.highlight);
          break;

        case 'line':
          this.drawLine(step.pos, step.cls, step.highlight);
          break;

        case 'linkLabel':
          this.drawLinkLabel(step.pos, step.label);
          break;

        case 'node':
          this.drawNode(step.id, step.label, step.pos, step.highlight);
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

  drawArrow(pos, cls, highlight) {
    let svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.classList.add('gridArrow');
    svg.classList.add(cls);
    svg.style.gridColumn = pos[0] + 1;
    svg.style.gridRow = pos[1] + 1;
    this.container_.appendChild(svg);
    svg.classList.toggle('highlight', highlight);

    let use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    svg.appendChild(use);
    use.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', '#' + cls);
  }

  drawGraphLabel(min, max, label) {
    let elem = document.createElement('div');
    this.container_.appendChild(elem);
    elem.classList.add('gridGraphLabel');
    elem.style.gridColumn = (min[0] + 1) + ' / ' + (max[0] + 2);
    elem.style.gridRow = (min[1] + 1) + ' / ' + (max[1] + 2);
    elem.innerText = label;
    this.toSize_.push(elem);
  }

  drawGroup(min, max, label, highlight) {
    let group = document.createElement('div');
    this.container_.appendChild(group);
    group.classList.add('gridGroup');
    group.style.gridColumn = (min[0] + 1) + ' / ' + (max[0] + 2);
    group.style.gridRow = (min[1] + 1) + ' / ' + (max[1] + 2);
    group.classList.toggle('highlight', highlight);

    if (label != '') {
      let labelNode = document.createElement('div');
      this.container_.appendChild(labelNode);
      labelNode.classList.add('gridGroupLabel');
      labelNode.innerText = label;
      labelNode.style.gridColumn = (min[0] + 1) + ' / ' + (max[0] + 2);
      labelNode.style.gridRow = min[1] + 1;
      this.toSize_.push(labelNode);
    }
  }

  drawLine(pos, cls, highlight) {
    let svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.classList.add('gridLines');
    svg.style.gridColumn = pos[0] + 1;
    svg.style.gridRow = pos[1] + 1;
    this.container_.appendChild(svg);
    svg.classList.toggle('highlight', highlight);

    let use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    svg.appendChild(use);
    use.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', '#' + cls);
  }

  drawLinkLabel(pos, label) {
    let elem = document.createElement('div');
    elem.classList.add('gridLinkLabel');
    this.container_.appendChild(elem);
    elem.innerText = label;
    elem.style.gridColumn = pos[0] + 1;
    elem.style.gridRow = pos[1] + 1;
    this.toSize_.push(elem);
  }

  drawNode(id, label, pos, highlight) {
    let node = document.createElement('div');
    node.classList.add('gridNode');
    this.container_.appendChild(node);
    node.innerText = label;
    node.classList.toggle('highlight', highlight);
    node.style.gridColumn = pos[0] + 1;
    node.style.gridRow = pos[1] + 1;
    this.toSize_.push(node);

    node.addEventListener('click', (e) => {
      let editorElem = document.getElementById(id);
      editorElem.classList.toggle('highlight');
      editorElem.setAttribute('data-arch-refresh', '');
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
