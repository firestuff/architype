class EditorNode extends EditorEntryBase {
  constructor(label) {
    super();

    this.elem_.classList.add('node');

    this.input_ = document.createElement('input');
    this.input_.type = 'text';
    this.input_.placeholder = 'node name';
    this.listen(this.input_, 'keydown', (e) => this.onInputKeyDown(e));
    this.listen(this.input_, 'input', (e) => this.onInput(e));
    this.listen(this.input_, 'blur', (e) => this.onBlur(e));
    this.elem_.appendChild(this.input_);

    this.lastSnapshotLabel_ = null;

    if (label) {
      this.setLabel(label);
    }
  }

  afterDomAdd() {
    this.input_.focus();
  }

  serialize() {
    return {
      type: 'node',
      id: this.getId(),
      label: this.getLabel(),
      highlight: this.elem_.classList.contains('highlight'),
    };
  }

  getLabel() {
    return this.input_.value;
  }

  setLabel(label) {
    this.input_.value = label;
    this.lastSnapshotLabel_ = label;
    this.onInput();
  }

  setHighlight(highlight) {
    this.elem_.classList.toggle('highlight', highlight);
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

  onInput() {
    this.elem_.setAttribute('data-arch-refresh', '');
  }

  onBlur() {
    if (this.getLabel() != this.lastSnapshotLabel_) {
      this.lastSnapshotLabel_ = this.getLabel();
      this.elem_.setAttribute('data-arch-snapshot', '');
    }
  }

  onInputKeyDown(e) {
    switch (e.key) {
      case 'Enter':
        e.preventDefault();
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
      case '`':
        e.preventDefault();
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

      case ' ':
        this.elem_.classList.toggle('highlight');
        this.onInput();
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
    node.setHighlight(ser.highlight);
    return node.getElement();
  }
}

