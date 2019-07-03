'use strict';

class Architype {
  constructor(container) {
    this.container_ = container;

    this.container_.classList.add('architype');
    // TODO: make theme selectable
    this.container_.classList.add('dark');

    this.container_.addEventListener('keydown', (e) => { this.onKeyDown(e); });
    addEventListener('resize', (e) => { this.onResize(e); });

    let editorElem = document.createElement('ul');
    this.container_.appendChild(editorElem);
    this.editor_ = new Editor(editorElem);

    this.targets_ = document.createElement('datalist');
    this.targets_.id = 'arch-targets';
    this.container_.appendChild(this.targets_);

    this.lines_ = document.createElement('div');
    this.lines_.innerHTML = `<!--# include file="lines.svg" -->`;
    this.lines_ = this.lines_.firstElementChild;
    this.lines_.classList.add('gridLines');
    this.lines_.classList.add('white');

    this.grid_ = document.createElement('div');
    this.grid_.classList.add('grid');
    this.container_.appendChild(this.grid_);

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
      editor: this.editor_.serialize(),
    };
  }

  unserialize(ser) {
    if (!ser) {
      return;
    }

    switch (ser.version) {
      case 1:
        this.editor_.unserialize(ser.editor);
        break;

      default:
        console.log('unrecognized localStorage.currentState version', ser);
        break;
    }
  }

  onChange(e) {
    let serialized = this.serialize();
    onmessage(serialized);
    localStorage.setItem('currentState', JSON.stringify(serialized));

    //this.updateTargets(this.graph_);
    //this.fixSizes(this.graph_.nodes);
  }

  onKeyDown(e) {
    switch (e.key) {
      case 'z':
        this.exportGraphviz();
        break;
    }
  }

  onResize(e) {
    this.fixSizes(this.graph_.nodes);
  }

  exportGraphviz() {
    let lines = [
        'digraph G {',
        '\trankdir = "LR";',
    ];

    for (let type of ['nodes', 'links', 'groups']) {
      for (let obj of this.graph_[type]) {
        for (let line of obj.exportGraphviz()) {
          lines.push('\t' + line);
        }
      }
    }

    lines.push('}');
    navigator.clipboard.writeText(lines.join('\n'));
  }

  updateTargets(graph) {
    // Lots of effort to avoid churning the datalist

    let curTargets = new Map();
    for (let option of this.targets_.options) {
      curTargets.set(option.value, option);
    }

    for (let [label, entries] of graph.nodesByLabel.entries()) {
      if (curTargets.has(label)) {
        continue;
      }
      if (entries.length == 1 &&
          document.activeElement.parentElement.xArchObj &&
          document.activeElement.parentElement.xArchObj == entries[0]) {
        // Skip an element currently being edited
        continue;
      }
      let option = document.createElement('option');
      option.value = label;
      this.targets_.appendChild(option);
    }

    for (let [label, option] of curTargets.entries()) {
      if (graph.nodesByLabel.has(label)) {
        continue;
      }
      option.remove();
    }
  }

  buildGrid(graph) {
    this.grid_.innerHTML = '';

    this.grid_.style.gridTemplateColumns =
        'repeat(' + graph.size[0] + ',1fr)';
    this.grid_.style.gridTemplateRows =
        'repeat(' + graph.size[1] +
        ',minmax(0, calc((100vw - var(--editor-width)) / ' +
        graph.size[0] + ')))';

    this.drawGridNodes(graph);
  }

  addLines(pos, cls) {
    let lines = this.lines_.cloneNode(true);
    lines.classList.add(cls);
    lines.style.gridColumn = pos[0] + 1;
    lines.style.gridRow = pos[1] + 1;
    this.grid_.appendChild(lines);
    return lines;
  }

  drawGridNodes(graph) {
    for (let node of graph.nodes) {
      node.gridElem = document.createElement('div');
      node.gridElem.classList.add('gridNode');
      this.grid_.appendChild(node.gridElem);
      node.gridElem.innerText = node.getLabel();
      node.gridElem.style.gridColumn = node.pos[0] + 1;
      node.gridElem.style.gridRow = node.pos[1] + 1;
    }
  }

  fixSizes(nodes) {
    for (let node of nodes) {
      let elem = node.gridElem;
      elem.style.fontSize = null;
      for (let size = 20;
           size && (elem.scrollWidth > elem.clientWidth ||
                    elem.scrollHeight > elem.clientHeight);
           --size) {
        elem.style.fontSize = size + 'px';
      }
    }
  }
}


<!--# include file="Editor.js" -->
<!--# include file="EditorEntryBase.js" -->
<!--# include file="EditorGroup.js" -->
<!--# include file="EditorLink.js" -->
<!--# include file="EditorNode.js" -->

<!--# include file="utils.js" -->

<!--# include file="render.js" -->

new Architype(document.getElementById('architype'));
