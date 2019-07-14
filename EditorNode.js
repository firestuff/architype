class EditorNode extends EditorInputBase {
  constructor(id, label) {
    super(id, label);

    this.elem_.classList.add('node');
    this.input_.placeholder = 'node name';
  }

  serialize() {
    return super.serialize({
      type: 'node',
    });
  }

  isSoft() {
    // Nested nodes are presumed to be references to other nodes if they exist
    for (let iter = this.elem_.parentElement; iter; iter = iter.parentElement) {
      if (iter.xArchObj) {
        return true;
      }
    }
    return false;
  }

  static unserialize(ser) {
    let node = new EditorNode(ser.id);
    node.setLabel(ser.label);
    node.setHighlight(ser.highlight);
    return node.getElement();
  }
}

