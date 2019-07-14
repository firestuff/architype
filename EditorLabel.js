class EditorLabel extends EditorInputBase {
  constructor(id, label) {
    super(id, label);

    this.elem_.classList.add('label');
    this.input_.placeholder = 'label';
  }

  serialize() {
    return super.serialize({
      type: 'label',
    });
  }

  static unserialize(ser) {
    let label = new EditorLabel(ser.id);
    label.setLabel(ser.label);
    label.setHighlight(ser.highlight);
    return label.getElement();
  }
}

