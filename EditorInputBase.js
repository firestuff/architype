class EditorInputBase extends EditorEntryBase {
  constructor(id, label) {
    super(id);

    this.input_ = document.createElement('input');
    this.input_.type = 'text';
    this.listen(this.input_, 'keydown', (e) => this.onInputKeyDown(e));
    this.listen(this.input_, 'input', () => this.onInput());
    this.listen(this.input_, 'blur', (e) => this.onBlur(e));
    this.elem_.appendChild(this.input_);

    this.lastLabel_ = '';
    this.lastSnapshotLabel_ = '';

    if (label) {
      this.setLabel(label);
    }
  }

  afterDomAdd() {
    this.input_.focus();
  }

  serialize(base) {
    super.serialize(base);
    base.label = this.getLabel();
    return base;
  }

  getLabel() {
    return this.input_.value;
  }

  setLabel(label) {
    this.input_.value = label;
    this.lastSnapshotLabel_ = label;
    this.updateLabel();
  }

  wantFocus() {
    return this.getLabel() == '';
  }

  updateLabel() {
    this.lastLabel_ = this.getLabel();

    let objs = document.getElementsByClassName('grid-' + this.getId());
    if (objs.length == 1) {
      objs[0].innerText = this.getLabel();
      objs[0].xArchFixSize();
    }
  }

  onInput() {
    this.updateLabel();
    this.requestRender();
  }

  onBlur() {
    if (this.getLabel() != this.lastSnapshotLabel_) {
      this.lastSnapshotLabel_ = this.getLabel();
      this.elem_.dispatchEvent(
          new CustomEvent('snapshotRequest', { bubbles: true }));
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
        this.stopEdit();
        e.preventDefault();
        e.stopPropagation();
        break;

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
      case 'ArrowRight':
      case 'Enter':
        this.ctrlKey_ = e.ctrlKey;
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
