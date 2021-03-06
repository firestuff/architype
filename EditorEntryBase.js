<!--# include file="ListenUtils.js" -->

class EditorEntryBase extends ListenUtils {
  constructor(id) {
    super();

    this.elem_ = document.createElement('li');
    this.elem_.tabIndex = 0;
    this.elem_.id = (id || ('entry' + idSource.getId()));
    this.listen(this.elem_, 'focus', () => this.onElemFocus());
    this.listen(this.elem_, 'keydown', (e) => this.onKeyDown(e));

    this.elem_.xArchObj = this;
    this.elem_.setAttribute('data-arch-class', this.constructor.name);
  }

  serialize(base) {
    base.id = this.getId();
    base.highlight = this.elem_.classList.contains('highlight');
    return base;
  }

  remove() {
    if (document.activeElement == this.elem_ ||
        document.activeElement == document.body) {
      if (this.elem_.nextElementSibling) {
        this.elem_.nextElementSibling.focus();
      } else if (this.elem_.previousElementSibling) {
        this.elem_.previousElementSibling.focus();
      } else if (this.elem_.parentElement) {
        this.elem_.parentElement.focus();
      }
    }

    this.elem_.remove();
    this.clearListeners();
    this.elem_.xArchObj = null;
  }

  wantFocus() {
    return false;
  }

  getElement() {
    return this.elem_;
  }

  getId() {
    return this.elem_.id;
  }

  setHighlight(highlight) {
    this.elem_.classList.toggle('highlight', highlight);
    for (let elem of document.getElementsByClassName('grid-' + this.getId())) {
      elem.classList.toggle('highlight', highlight);
    }
    // Do NOT refresh: this bypasses the rendering pipeline
    this.elem_.dispatchEvent(
        new CustomEvent('snapshotRequest', { bubbles: true }));
  }

  toggleHighlight() {
    this.setHighlight(!this.elem_.classList.contains('highlight'));
  }

  onElemFocus() {
    this.elem_.scrollIntoView({block: 'nearest'});
  }

  onKeyDown(e) {
    switch (e.key) {
      case ' ':
        this.toggleHighlight();
        e.stopPropagation();
        e.preventDefault();
        break;
    }
  }

  afterDomAdd() {
  }

  requestRender() {
    this.elem_.dispatchEvent(
        new CustomEvent('renderRequest', { bubbles: true }));
  }

  static addBefore(container, elem, ...rest) {
    let entry = new this(null, ...rest);
    container.insertBefore(entry.getElement(), elem);
    entry.afterDomAdd();
    return entry;
  }

  static addAfter(container, elem, ...rest) {
    let entry = new this(null, ...rest);
    container.insertBefore(entry.getElement(), elem ? elem.nextSibling : null);
    entry.afterDomAdd();
    return entry;
  }

  static unserialize(ser) {
    switch (ser.type) {
      case 'group':
        return EditorGroup.unserialize(ser);
      case 'help':
        return EditorHelp.unserialize(ser);
      case 'label':
        return EditorLabel.unserialize(ser);
      case 'link':
        return EditorLink.unserialize(ser);
      case 'node':
        return EditorNode.unserialize(ser);
      case 'tag':
        return EditorTag.unserialize(ser);
    }
  }
}
