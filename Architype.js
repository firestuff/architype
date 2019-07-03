'use strict';

class Architype {
  constructor(container) {
    this.container_ = container;

    this.container_.classList.add('architype');
    // TODO: make theme selectable
    this.container_.classList.add('dark');

    addEventListener('resize', (e) => { this.onResize(e); });

    let editorElem = document.createElement('ul');
    this.container_.appendChild(editorElem);
    this.editor_ = new Editor(editorElem);

    this.lines_ = document.createElement('div');
    this.lines_.innerHTML = `<!--# include file="lines.svg" -->`;
    this.lines_ = this.lines_.firstElementChild;
    this.lines_.classList.add('gridLines');
    this.lines_.classList.add('white');

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

    this.observer_ = new MutationObserver(e => { this.onChange(e); });
    this.observer_.observe(editorElem, {
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

  onResize(e) {
    this.fixSizes();
  }

  draw(steps) {
    this.grid_.innerHTML = '';
    this.gridNodes_ = [];

    for (let step of steps) {
      switch (step.type) {
        case 'size':
          this.drawGrid(step.size);
          break;

        case 'node':
          this.drawGridNode(step.label, step.pos);
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

  drawGridNode(label, pos) {
    let node = document.createElement('div');
    node.classList.add('gridNode');
    this.grid_.appendChild(node);
    node.innerText = label;
    node.style.gridColumn = pos[0] + 1;
    node.style.gridRow = pos[1] + 1;
    this.gridNodes_.push(node);
  }

  fixSizes() {
    for (let node of this.gridNodes_) {
      node.style.fontSize = null;
      for (let size = 20;
           size && (node.scrollWidth > node.clientWidth ||
                    node.scrollHeight > node.clientHeight);
           --size) {
        node.style.fontSize = size + 'px';
      }
    }
  }

  // TODO: fix this
  addLines(pos, cls) {
    let lines = this.lines_.cloneNode(true);
    lines.classList.add(cls);
    lines.style.gridColumn = pos[0] + 1;
    lines.style.gridRow = pos[1] + 1;
    this.grid_.appendChild(lines);
    return lines;
  }
}


<!--# include file="Editor.js" -->
<!--# include file="EditorEntryBase.js" -->
<!--# include file="EditorGroup.js" -->
<!--# include file="EditorLink.js" -->
<!--# include file="EditorNode.js" -->

<!--# include file="utils.js" -->

new Architype(document.getElementById('architype'));
