class EditorLink extends EditorEntryBase {
  constructor() {
    super();

    this.elem_.innerText = '↓';
    this.elem_.classList.add('link');

    let nodeList = document.createElement('div');
    this.nodes_ = new Editor(nodeList, [
      [EditorNode,  [2, 2]],
      [EditorLabel, [0, 1]],
    ]);
    this.nodes_.addNodeAfter();
    this.nodes_.addNodeAfter();
    this.elem_.appendChild(nodeList);
  }

  afterDomAdd() {
    this.nodes_.selectNext();
    this.nodes_.getSelected().xArchObj.startEdit();
  }

  serialize() {
    return {
      type: 'link',
      label: this.getLabel(),
      from: this.getFrom().serialize(),
      to: this.getTo().serialize(),
    };
  }

  getFrom() {
    return this.nodes_.getEntries(EditorNode)[0];
  }

  getTo() {
    return this.nodes_.getEntries(EditorNode)[1];
  }

  getLabel() {
    let label = this.nodes_.getEntries(EditorLabel)[0];
    return label ? label.getLabel() : null;
  }

  setLabel(label) {
    let obj = this.nodes_.getEntries(EditorLabel)[0];
    if (obj) {
      obj.setLabel(label);
    } else {
      this.nodes_.addLabelBefore();
      this.setLabel(label);
    }
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
    let link = new EditorLink();
    link.nodes_.clear();
    if (ser.label != null) {
      link.setLabel(ser.label);
    }
    link.nodes_.unserialize([ser.from, ser.to]);
    return link.getElement();
  }
}
