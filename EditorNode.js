class EditorNode extends EditorInputBase {
  constructor(id, label) {
    super(id, label);

    this.elem_.classList.add('node');
    this.input_.placeholder = 'node name';
  }

  serialize() {
    return super.serialize({
      type: 'node',
      highlight: this.elem_.classList.contains('highlight'),
    });
  }

  setHighlight(highlight) {
    this.elem_.classList.toggle('highlight', highlight);
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

  onKeyDown(e) {
    super.onKeyDown(e);

    switch (e.key) {
      case ' ':
        this.elem_.classList.toggle('highlight');
        this.elem_.setAttribute('data-arch-snapshot', '');
        this.onInput();
        e.stopPropagation();
        e.preventDefault();
        break;
    }
  }

  static unserialize(ser) {
    let node = new EditorNode(ser.id);
    node.setLabel(ser.label);
    node.setHighlight(ser.highlight);
    return node.getElement();
  }
}

