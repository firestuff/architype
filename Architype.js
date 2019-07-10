'use strict';

class Architype {
  constructor(container) {
    this.container_ = container;

    this.container_.classList.add('architype');
    // TODO: make theme selectable
    this.container_.classList.add('dark');

    addEventListener('resize', (e) => { this.onResize(e); });
    document.addEventListener('keydown',
                              (e) => { this.onKeyDown(e); },
                              { capture: true });

    this.editorElem_ = document.createElement('ul');
    this.container_.appendChild(this.editorElem_);
    this.editor_ = new Editor(this.editorElem_);

    this.grid_ = document.createElement('div');
    this.grid_.classList.add('grid');
    this.container_.appendChild(this.grid_);

    this.generation_ = 0;
    this.renderGeneration_ = -1;
    this.drawGeneration_ = -1;

    this.render_ = [];
    for (let i = 0; i < navigator.hardwareConcurrency; ++i) {
      let render = new Worker('render.js');
      render.addEventListener('message', (e) => { this.onRender(e); });
      this.render_.push(render);
    }

    this.unserialize(JSON.parse(localStorage.getItem('currentState')));
    if (this.editor_.getEntries().length == 0) {
      this.editor_.addHelpAfter();
    }
    this.editor_.selectNext();

    this.observer_ = new MutationObserver(e => { this.onChange(e); });
    this.observer_.observe(this.editorElem_, {
      attributes: true,
      attributeFilter: ['data-arch-value'],
      childList: true,
      subtree: true,
    });

    this.onChange();
  }

  serialize() {
    return {
      version: 1,
      generation: ++this.generation_,
      editor: this.editor_.serialize(),
    };
  }

  unserialize(ser) {
    if (!ser) {
      return;
    }

    switch (ser.version) {
      case 1:
        this.generation_ = ser.generation;
        this.editor_.unserialize(ser.editor);
        break;

      default:
        console.log('unrecognized localStorage.currentState version', ser);
        break;
    }
  }

  onChange(e) {
    this.serialized_ = this.serialize();
    this.startRender();
    localStorage.setItem('currentState', JSON.stringify(this.serialized_));
  }

  onKeyDown(e) {
    let elem = document.activeElement;
    while (elem) {
      if (elem == this.editorElem_) {
        return;
      }
      elem = elem.parentElement;
    }
    this.editor_.onKeyDown(e);
  }

  onRender(e) {
    this.render_.push(e.target);

    if (e.data.generation > this.drawGeneration_) {
      // Received newer than we've drawn; redraw
      this.drawGeneration_ = e.data.generation;
      this.draw(e.data.steps);
      this.fixSizes();
    }

    this.startRender();
  }

  startRender() {
    if (this.generation_ == this.renderGeneration_) {
      // Already sent this generation for rendering
      return;
    }

    let render = this.render_.pop();
    if (!render) {
      // Ran out of workers
      return;
    }

    this.renderGeneration_ = this.serialized_.generation;
    render.postMessage(this.serialized_);
  }

  // TODO: factor out draw/grid code
  onResize(e) {
    this.fixSizes();
  }

  draw(steps) {
    this.grid_.innerHTML = '';
    this.toSize_ = [];

    for (let step of steps) {
      switch (step.type) {
        case 'size':
          this.drawGrid(step.size);
          break;

        case 'arrow':
          this.drawArrow(step.pos, step.cls);
          break;

        case 'graphLabel':
          this.drawGraphLabel(step.min, step.max, step.label);
          break;

        case 'group':
          this.drawGroup(step.min, step.max, step.label);
          break;

        case 'line':
          this.drawLine(step.pos, step.cls);
          break;

        case 'linkLabel':
          this.drawLinkLabel(step.pos, step.label);
          break;

        case 'node':
          this.drawNode(step.label, step.pos);
          break;
      }
    }
  }

  drawGrid(size) {
    this.grid_.style.gridTemplateColumns =
        'repeat(' + size[0] + ',1fr)';
    this.grid_.style.gridTemplateRows =
        'repeat(' + size[1] +
        ',minmax(0, calc((100vw - var(--editor-width)) / ' +
        size[0] + ')))';
  }

  drawArrow(pos, cls) {
    let svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.classList.add('gridArrow');
    svg.classList.add(cls);
    svg.style.gridColumn = pos[0] + 1;
    svg.style.gridRow = pos[1] + 1;
    this.grid_.appendChild(svg);

    let use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    svg.appendChild(use);
    use.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', '#' + cls);
  }

  drawGraphLabel(min, max, label) {
    let elem = document.createElement('div');
    this.grid_.appendChild(elem);
    elem.classList.add('gridGraphLabel');
    elem.style.gridColumn = (min[0] + 1) + ' / ' + (max[0] + 2);
    elem.style.gridRow = (min[1] + 1) + ' / ' + (max[1] + 2);
    elem.innerText = label;
    this.toSize_.push(elem);
  }

  drawGroup(min, max, label) {
    let group = document.createElement('div');
    this.grid_.appendChild(group);
    group.classList.add('gridGroup');
    group.style.gridColumn = (min[0] + 1) + ' / ' + (max[0] + 2);
    group.style.gridRow = (min[1] + 1) + ' / ' + (max[1] + 2);

    if (label != '') {
      let labelNode = document.createElement('div');
      this.grid_.appendChild(labelNode);
      labelNode.classList.add('gridGroupLabel');
      labelNode.innerText = label;
      labelNode.style.gridColumn = (min[0] + 1) + ' / ' + (max[0] + 2);
      labelNode.style.gridRow = min[1] + 1;
      this.toSize_.push(labelNode);
    }
  }

  drawLine(pos, cls) {
    let svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.classList.add('gridLines');
    svg.style.gridColumn = pos[0] + 1;
    svg.style.gridRow = pos[1] + 1;
    this.grid_.appendChild(svg);

    let use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    svg.appendChild(use);
    use.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', '#' + cls);
  }

  drawLinkLabel(pos, label) {
    let elem = document.createElement('div');
    elem.classList.add('gridLinkLabel');
    this.grid_.appendChild(elem);
    elem.innerText = label;
    elem.style.gridColumn = pos[0] + 1;
    elem.style.gridRow = pos[1] + 1;
    this.toSize_.push(elem);
  }

  drawNode(label, pos) {
    let node = document.createElement('div');
    node.classList.add('gridNode');
    this.grid_.appendChild(node);
    node.innerText = label;
    node.style.gridColumn = pos[0] + 1;
    node.style.gridRow = pos[1] + 1;
    this.toSize_.push(node);
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

<!--# include file="Editor.js" -->
<!--# include file="Grid.js" -->

<!--# include file="utils.js" -->

new Architype(document.getElementById('architype'));
