class EditorLabel extends EditorInputBase {
  constructor(id, label) {
    super(id, label);

    this.elem_.classList.add('label');
    this.input_.placeholder = 'label';
  }

  serialize() {
    return super.serialize({
      type: 'label',
      id: this.getId(),
    });
  }

  onKeyDown(e) {
    super.onKeyDown(e);

    switch (e.key) {
      case ' ':
        // We don't support highlighting, but stop propagation
        e.stopPropagation();
        e.preventDefault();
        break;
    }
  }

  static unserialize(ser) {
    let label = new EditorLabel(ser.id);
    label.setLabel(ser.label);
    return label.getElement();
  }
}

