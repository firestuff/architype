class EditorInputBase extends EditorEntryBase {
  constructor(id, label) {
    super(id);

    this.input_ = document.createElement('input');
    this.input_.type = 'text';
    this.listen(this.input_, 'keydown', (e) => this.onInputKeyDown(e));
    this.listen(this.input_, 'input', (e) => this.onInput(e));
    this.listen(this.input_, 'blur', (e) => this.onBlur(e));
    this.elem_.appendChild(this.input_);

    this.lastSnapshotLabel_ = '';

    if (label) {
      this.setLabel(label);
    }
  }

  afterDomAdd() {
    this.input_.focus();
  }

  serialize(base) {
    base.id = this.getId();
    base.label = this.getLabel();
    return base;
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
    }
  }

  startEdit() {
    this.input_.focus();
  }

  stopEdit() {
    this.elem_.focus();
  }
}
