class EditorNode extends EditorEntryBase {
  constructor() {
    super();

    this.elem_.classList.add('node');

    this.input_ = document.createElement('input');
    this.input_.type = 'text';
    this.input_.placeholder = 'node name';
    this.listen(this.input_, 'keydown', (e) => this.onInputKeyDown(e));
    this.listen(this.input_, 'input', (e) => this.onInput());
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

  getLabel() {
    return this.input_.value;
  }

  setLabel(label) {
    this.input_.value = label;
    this.onInput();
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

