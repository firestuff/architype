class EditorGroup extends EditorEntryBase {
  constructor() {
    super();

    this.elem_.innerText = 'Group:';
    this.elem_.classList.add('group');

    this.input_ = document.createElement('input');
    this.input_.type = 'text';
    this.input_.placeholder = 'group name';
    this.listen(this.input_, 'keydown', (e) => this.onInputKeyDown(e));
    this.listen(this.input_, 'input', (e) => this.onInput());
    this.listen(this.input_, 'blur', (e) => this.onInput());
    this.elem_.appendChild(this.input_);

    let nodeList = document.createElement('div');
    this.nodes_ = new Editor(nodeList, [Editor.NODE]);
    this.nodes_.setMinEntries(1);
    this.nodes_.addNodeAfter();
    this.elem_.appendChild(nodeList);
  }

  afterDomAdd() {
    this.input_.focus();
  }

  serialize() {
    return {
      type: 'group',
      label: this.getLabel(),
      members: this.nodes_.serialize(),
    };
  }

  exportGraphviz() {
    let lines = [
        'subgraph "cluster_' + this.id + '" {',
    ];

    if (this.getLabel() != '') {
      lines.push('\tlabel = "' + this.getLabel() + '";');
    }

    for (let obj of this.nodes) {
      for (let line of obj.exportGraphviz()) {
        lines.push('\t' + line);
      }
    }

    lines.push('}');
    return lines;
  }

  clear() {
    super.clear();
  }

  getNodes() {
    return this.nodes_.getEntries();
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

  getCollection() {
    return new Collection(this.nodes);
  }

  onInputKeyDown(e) {
    switch (e.key) {
      case 'Enter':
        e.stopPropagation();
        e.preventDefault();
        this.stopEdit();
        {
          let nodes = this.nodes_.getEntries();
          if (nodes.length == 1 && nodes[0].getLabel() == '') {
            nodes[0].startEdit();
          }
        }
        break;

      case 'Escape':
        e.stopPropagation();
        e.preventDefault();
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

      case 'ArrowRight':
      case 'l':
        this.nodes_.selectNext();
        break;
    }
  }

  onInput() {
    this.input_.setAttribute('data-arch-value', this.input_.value);
  }

  startEdit() {
    this.input_.focus();
  }

  stopEdit() {
    this.elem_.focus();
  }

  static unserialize(ser) {
    let group = new EditorGroup();
    group.setLabel(ser.label);
    group.nodes_.clear();
    group.nodes_.unserialize(ser.members);
    return group.getElement();
  }
}
