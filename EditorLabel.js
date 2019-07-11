// TODO: Factor out common code with EditorNode
class EditorLabel extends EditorEntryBase {
  constructor() {
    super();

    this.elem_.classList.add('label');

    this.input_ = document.createElement('input');
    this.input_.type = 'text';
    this.input_.placeholder = 'label';
    this.listen(this.input_, 'keydown', (e) => this.onInputKeyDown(e));
    this.listen(this.input_, 'input', (e) => this.onInput(e));
    this.listen(this.input_, 'blur', (e) => this.onBlur(e));
    this.elem_.appendChild(this.input_);

    this.lastSnapshotLabel_ = null;
  }

  afterDomAdd() {
    this.input_.focus();
  }

  serialize() {
    return {
      type: 'label',
      label: this.getLabel(),
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

  wantFocus() {
    return this.getLabel() == '';
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
        // We don't support highlighting, but stop propagation
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
    let label = new EditorLabel();
    label.setLabel(ser.label);
    return label.getElement();
  }
}

