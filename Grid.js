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
          this.drawGroup(step.id, step.min, step.max);
          break;

        case 'groupLabel':
          this.drawGroupLabel(step.id, step.min, step.max, step.label);
          break;

        case 'line':
          this.drawLine(step.id, step.pos, step.cls);
          break;

        case 'linkLabel':
          this.drawLinkLabel(step.id, step.pos, step.label);
          break;

        case 'node':
          this.drawNode(step.id, step.label, step.pos, step.tags);
          break;

        case 'tagLabel':
          this.drawTagLabel(step.id, step.pos, step.label, step.tag);
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
    svg.style.gridColumn = pos[0] + 1;
    svg.style.gridRow = pos[1] + 1;
    this.linkToEditor(svg, id, false);

    let use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    svg.appendChild(use);
    use.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', '#' + cls);
  }

  drawGraphLabel(id, min, max, label) {
    let elem = document.createElement('div');
    this.container_.appendChild(elem);
    elem.classList.add('gridGraphLabel');
    elem.classList.add('grid-' + id);
    elem.style.gridColumn = (min[0] + 1) + ' / ' + (max[0] + 2);
    elem.style.gridRow = (min[1] + 1) + ' / ' + (max[1] + 2);
    elem.innerText = label;
    this.linkToEditor(elem, id, true);
  }

  drawGroup(id, min, max) {
    let group = document.createElement('div');
    this.container_.appendChild(group);
    group.classList.add('gridGroup');
    group.classList.add('grid-' + id);
    group.style.gridColumn = (min[0] + 1) + ' / ' + (max[0] + 2);
    group.style.gridRow = (min[1] + 1) + ' / ' + (max[1] + 2);
    this.linkToEditor(group, id, false);
  }

  drawGroupLabel(id, min, max, label) {
    let elem = document.createElement('div');
    this.container_.appendChild(elem);
    elem.classList.add('gridGroupLabel');
    elem.classList.add('grid-' + id);
    elem.innerText = label;
    elem.style.gridColumn = (min[0] + 1) + ' / ' + (max[0] + 2);
    elem.style.gridRow = min[1] + 1;
    this.linkToEditor(elem, id, true);
  }

  drawLine(id, pos, cls) {
    let svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.container_.appendChild(svg);
    svg.classList.add('gridLines');
    svg.classList.add('grid-' + id);
    svg.style.gridColumn = pos[0] + 1;
    svg.style.gridRow = pos[1] + 1;
    this.linkToEditor(svg, id, false);

    let use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    svg.appendChild(use);
    use.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', '#' + cls);
  }

  drawLinkLabel(id, pos, label) {
    let elem = document.createElement('div');
    this.container_.appendChild(elem);
    elem.classList.add('gridLinkLabel');
    elem.classList.add('grid-' + id);
    elem.innerText = label;
    elem.style.gridColumn = pos[0] + 1;
    elem.style.gridRow = pos[1] + 1;
    this.linkToEditor(elem, id, true);
  }

  drawNode(id, label, pos, tags) {
    let node = document.createElement('div');
    this.container_.appendChild(node);
    node.classList.add('gridNode');
    node.classList.add('grid-' + id);
    node.innerText = label;
    node.style.gridColumn = pos[0] + 1;
    node.style.gridRow = pos[1] + 1;
    for (let tag of tags) {
      node.classList.add('tag' + tag);
    }
    this.linkToEditor(node, id, true);
  }

  drawTagLabel(id, pos, label, tag) {
    let elem = document.createElement('div');
    this.container_.appendChild(elem);
    elem.classList.add('gridTagLabel');
    elem.classList.add('grid-' + id);
    elem.innerText = label;
    elem.style.gridColumn = pos[0] + 1;
    elem.style.gridRow = pos[1] + 1;
    elem.classList.add('tag' + tag);
    this.linkToEditor(elem, id, true);
  }

  linkToEditor(elem, id, copyLabel) {
    let source = document.getElementById(id);
    if (!source) {
      return;
    }

    elem.classList.toggle('highlight', source.classList.contains('highlight'));
    if (copyLabel) {
      elem.innerText = source.xArchObj.getLabel();
      elem.xArchFixSize = () => {
        this.fixSize(elem);
      };
      this.toSize_.push(elem);
    }

    elem.addEventListener('click', () => {
      let editorElem = document.getElementById(id);
      if (!editorElem) {
        return;
      }
      editorElem.xArchObj.toggleHighlight();
      editorElem.focus();
    });
  }

  fixSize(elem) {
    elem.style.fontSize = null;
    for (let size = 30;
         size && (elem.scrollWidth > elem.clientWidth ||
                  elem.scrollHeight > elem.clientHeight);
         --size) {
      elem.style.fontSize = size + 'px';
    }
  }

  fixSizes() {
    for (let node of this.toSize_) {
      node.xArchFixSize();
    }
  }
}
