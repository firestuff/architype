class EditorNode extends EditorEntryBase {
  constructor() {
    super();

    this.elem_.innerText = 'Node:';
    this.elem_.classList.add('node');

    this.input_ = document.createElement('input');
    this.input_.type = 'text';
    this.input_.placeholder = 'node name';
    this.input_.setAttribute('list', 'arch-targets');
    this.listen(this.input_, 'keydown', (e) => this.onInputKeyDown(e));
    this.listen(this.input_, 'input', (e) => this.onInput());
    this.listen(this.input_, 'blur', (e) => this.onInput());
    this.elem_.appendChild(this.input_);
  }

  afterDomAdd() {
    this.input_.focus();
  }

  serialize() {
    return {
      type: 'node',
      label: this.getLabel(),
    };
  }

  exportGraphviz() {
    if (this.getLabel() == '') {
      return [];
    }
    return ['"' + this.id + '" [label="' + this.getLabel() + '"];'];
  }

  clear() {
    super.clear();
    this.links = [];
    this.groups = [];
    this.affinity = [];
    this.pageRank = 0;
    this.subgraph = null;
  }

  getLabel() {
    return this.input_.value;
  }

  setLabel(label) {
    this.input_.value = label;
    this.onInput();
  }

  getElement() {
    return this.elem_;
  }

  wantFocus() {
    return this.getLabel() == '';
  }

  isSoft() {
    // Nested nodes are presumed to be references to other nodes if they exist
    let iter = this.elem_.parentElement;
    for (let iter = this.elem_.parentElement; iter; iter = iter.parentElement) {
      if (iter.xArchObj) {
        return true;
      }
    }
    return false;
  }

  setTension() {
    this.vec = [0, 0];
    this.tension = 0;
    for (let aff of this.affinity) {
      let vec = [], vecsum = 0;
      for (let i of [0, 1]) {
        vec[i] = aff.node.pos[i] - this.pos[i];
        vecsum += Math.abs(vec[i]);
      };
      let distance = Math.sqrt(Math.pow(vec[0], 2) + Math.pow(vec[1], 2));
      let weight = aff.distanceToWeight(distance);
      for (let i of [0, 1]) {
        this.vec[i] += (weight * vec[i]) / vecsum;
      }
      this.tension += Math.abs(weight);
    }
  }

  offsetToPos(offset) {
    return [
        this.pos[0] + offset[0],
        this.pos[1] + offset[1],
    ];
  }

  offsetCollides(graph, offset) {
    let newPos = this.offsetToPos(offset);
    return graph.nodesByPos.get(newPos.toString());
  }

  moveBy(graph, offset) {
    this.moveTo(graph, this.offsetToPos(offset));
  }

  moveTo(graph, pos) {
    if (this.pos) {
      graph.nodesByPos.delete(this.pos.toString());
    }
    this.pos = pos;
    graph.nodesByPos.set(this.pos.toString(), this);
  }

  savePos() {
    this.savedPos = this.pos;
  }

  restorePos(graph) {
    this.moveTo(graph, this.savedPos);
  }

  onInput() {
    if (!this.input_.getAttribute('data-arch-value') ||
        this.input_.value == '') {
      this.input_.setAttribute('data-struct-change', 'x');
    }
    this.input_.setAttribute('data-arch-value', this.input_.value);
  }

  onInputKeyDown(e) {
    switch (e.key) {
      case 'Enter':
        e.stopPropagation();
        if (this.elem_.nextElementSibling &&
            this.elem_.nextElementSibling.xArchObj &&
            this.elem_.nextElementSibling.xArchObj.wantFocus()) {
          this.elem_.nextElementSibling.xArchObj.startEdit();
        } else {
          this.stopEdit();
        }
        break;

      case 'Escape':
        e.stopPropagation();
        this.stopEdit();
        break;

      case 'ArrowUp':
      case 'ArrowDown':
      case 'PageUp':
      case 'PageDown':
        this.stopEdit();
        break;

      default:
        e.stopPropagation();
        break;
    }
  }

  onKeyDown(e) {
    super.onKeyDown(e);

    switch (e.key) {
      case 'Enter':
        this.startEdit();
        e.stopPropagation();
        e.preventDefault();
        break;
    }
  }

  startEdit() {
    this.input_.focus();
  }

  stopEdit() {
    this.elem_.focus();
  }

  static unserialize(ser) {
    let node = new EditorNode();
    node.setLabel(ser.label);
    return node.getElement();
  }
}

