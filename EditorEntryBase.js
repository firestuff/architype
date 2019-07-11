<!--# include file="ListenUtils.js" -->

class EditorEntryBase extends ListenUtils {
  constructor() {
    super();

    this.elem_ = document.createElement('li');
    this.elem_.tabIndex = 0;
    this.elem_.id = 'entry' + idSource.getId();
    this.listen(this.elem_, 'focus', () => this.onElemFocus());
    this.listen(this.elem_, 'keydown', (e) => this.onKeyDown(e));

    this.elem_.xArchObj = this;
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

  onElemFocus() {
    this.elem_.scrollIntoView({block: 'nearest'});
  }

  onKeyDown(e) {
  }

  afterDomAdd() {
  }

  static addBefore(container, elem, ...rest) {
    let entry = new this(...rest);
    container.insertBefore(entry.getElement(), elem);
    entry.afterDomAdd();
  }

  static addAfter(container, elem, ...rest) {
    let entry = new this(...rest);
    container.insertBefore(entry.getElement(), elem ? elem.nextSibling : null);
    entry.afterDomAdd();
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
    }
  }
}
