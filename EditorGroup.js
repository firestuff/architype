class EditorGroup extends EditorEntryBase {
  constructor() {
    super();

    this.elem_.innerText = '□';
    this.elem_.classList.add('group');

    let nodeList = document.createElement('div');
    this.nodes_ = new Editor(nodeList, [Editor.NODE]);
    this.nodes_.setMinEntries(1);
    this.nodes_.addNodeAfter();
    this.elem_.appendChild(nodeList);
  }

  afterDomAdd() {
    this.nodes_.selectNext();
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

  getNodes() {
    return this.nodes_.getEntries();
  }

  getLabel() {
    // TODO
    return '';
  }

  setLabel(label) {
    // TODO
    //this.input_.value = label;
    //this.input_.setAttribute('data-arch-value', this.input_.value);
  }

  getElement() {
    return this.elem_;
  }

  onKeyDown(e) {
    super.onKeyDown(e);

    switch (e.key) {
      case 'Enter':
      case 'ArrowRight':
      case 'l':
        this.nodes_.selectNext();
        e.stopPropagation();
        e.preventDefault();
        break;
    }
  }

  static unserialize(ser) {
    let group = new EditorGroup();
    group.setLabel(ser.label);
    group.nodes_.clear();
    group.nodes_.unserialize(ser.members);
    return group.getElement();
  }
}
